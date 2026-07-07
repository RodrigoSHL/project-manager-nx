import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
  ) {}

  create(userId: string, dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripsRepository.create({ ...dto, userId });
    return this.tripsRepository.save(trip);
  }

  findAll(userId: string): Promise<Trip[]> {
    return this.tripsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['activities', 'travelDays'],
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    if (trip.userId !== userId) throw new ForbiddenException();
    return trip;
  }

  async update(userId: string, id: string, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.findOne(userId, id);
    Object.assign(trip, dto);
    return this.tripsRepository.save(trip);
  }

  async remove(userId: string, id: string): Promise<void> {
    const trip = await this.findOne(userId, id);
    await this.tripsRepository.remove(trip);
  }
}
