import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { TripMember, TripMemberRole } from './entities/trip-member.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { ShareTripDto } from './dto/share-trip.dto';
import { UpdateTripMemberDto } from './dto/update-trip-member.dto';
import { UserApiClient } from './user-api.client';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(TripMember)
    private readonly tripMembersRepository: Repository<TripMember>,
    private readonly userApiClient: UserApiClient
  ) {}

  create(userId: string, dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripsRepository.create({ ...dto, userId });
    return this.tripsRepository.save(trip);
  }

  findAll(userId: string): Promise<Trip[]> {
    return this.tripsRepository.find({
      where: [{ userId }, { members: { userId } }],
      relations: ['members'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['activities', 'travelDays', 'members'],
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (!this.canRead(trip, userId)) throw new ForbiddenException();
    return trip;
  }

  async update(userId: string, id: string, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.assertCanEdit(userId, id);
    Object.assign(trip, dto);
    return this.tripsRepository.save(trip);
  }

  async remove(userId: string, id: string): Promise<void> {
    const trip = await this.assertOwner(userId, id);
    await this.tripsRepository.remove(trip);
  }

  async findMembers(userId: string, tripId: string): Promise<TripMember[]> {
    await this.findOne(userId, tripId);
    return this.tripMembersRepository.find({
      where: { tripId },
      order: { createdAt: 'ASC' },
    });
  }

  async addMember(
    ownerId: string,
    tripId: string,
    dto: ShareTripDto
  ): Promise<TripMember> {
    await this.assertOwner(ownerId, tripId);
    const user = await this.userApiClient.findByEmail(dto.email);

    if (user.id === ownerId) {
      throw new ConflictException('The trip owner is already a member');
    }

    const existing = await this.tripMembersRepository.findOneBy({
      tripId,
      userId: user.id,
    });
    if (existing) {
      throw new ConflictException('The trip is already shared with this user');
    }

    const member = this.tripMembersRepository.create({
      tripId,
      userId: user.id,
      role: dto.role ?? TripMemberRole.EDITOR,
    });
    return this.tripMembersRepository.save(member);
  }

  async updateMember(
    ownerId: string,
    tripId: string,
    memberUserId: string,
    dto: UpdateTripMemberDto
  ): Promise<TripMember> {
    await this.assertOwner(ownerId, tripId);
    const member = await this.findMember(tripId, memberUserId);
    member.role = dto.role;
    return this.tripMembersRepository.save(member);
  }

  async removeMember(
    ownerId: string,
    tripId: string,
    memberUserId: string
  ): Promise<void> {
    await this.assertOwner(ownerId, tripId);
    const member = await this.findMember(tripId, memberUserId);
    await this.tripMembersRepository.remove(member);
  }

  async assertCanEdit(userId: string, id: string): Promise<Trip> {
    const trip = await this.findOne(userId, id);
    const canEdit =
      trip.userId === userId ||
      trip.members.some(
        (member) =>
          member.userId === userId && member.role === TripMemberRole.EDITOR
      );
    if (!canEdit) throw new ForbiddenException('Trip is read-only');
    return trip;
  }

  private async assertOwner(userId: string, id: string): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'Only the trip owner can perform this action'
      );
    }
    return trip;
  }

  private async findMember(
    tripId: string,
    userId: string
  ): Promise<TripMember> {
    const member = await this.tripMembersRepository.findOneBy({
      tripId,
      userId,
    });
    if (!member) throw new NotFoundException('Trip member not found');
    return member;
  }

  private canRead(trip: Trip, userId: string): boolean {
    return (
      trip.userId === userId ||
      trip.members.some((member) => member.userId === userId)
    );
  }
}
