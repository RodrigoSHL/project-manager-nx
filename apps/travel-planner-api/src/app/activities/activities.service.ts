import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { TripsService } from '../trips/trips.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { decimalToMinor, minorToDecimal } from '../finance/money';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    private readonly tripsService: TripsService
  ) {}

  async create(
    userId: string,
    tripId: string,
    dto: CreateActivityDto
  ): Promise<Activity> {
    const trip = await this.tripsService.assertCanEdit(userId, tripId);
    this.assertFinancialParticipants(trip, dto);
    const activity = this.activitiesRepository.create({
      ...this.toEntity(dto),
      tripId,
      countries: dto.countries ?? [],
    });
    return this.present(await this.activitiesRepository.save(activity));
  }

  async findAll(userId: string, tripId: string): Promise<Activity[]> {
    await this.tripsService.findOne(userId, tripId);
    const activities = await this.activitiesRepository.find({
      where: { tripId },
      order: { date: 'ASC', startTime: 'ASC' },
    });
    return activities.map((activity) => this.present(activity));
  }

  async findOne(userId: string, tripId: string, id: string): Promise<Activity> {
    await this.tripsService.findOne(userId, tripId);
    const activity = await this.activitiesRepository.findOne({
      where: { id, tripId },
    });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return this.present(activity);
  }

  async update(
    userId: string,
    tripId: string,
    id: string,
    dto: UpdateActivityDto
  ): Promise<Activity> {
    const trip = await this.tripsService.assertCanEdit(userId, tripId);
    this.assertFinancialParticipants(trip, dto);
    const activity = await this.findActivity(tripId, id);
    Object.assign(activity, this.toEntity(dto));
    return this.present(await this.activitiesRepository.save(activity));
  }

  async remove(userId: string, tripId: string, id: string): Promise<void> {
    await this.tripsService.assertCanEdit(userId, tripId);
    const activity = await this.findActivity(tripId, id);
    await this.activitiesRepository.remove(activity);
  }

  private async findActivity(tripId: string, id: string): Promise<Activity> {
    const activity = await this.activitiesRepository.findOne({
      where: { id, tripId },
    });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  private toEntity(dto: CreateActivityDto | UpdateActivityDto) {
    const { price, ...data } = dto;
    return { ...data, priceCurrency: data.priceCurrency?.toUpperCase(), priceMinor: price && data.priceCurrency ? decimalToMinor(price, data.priceCurrency).toString() : price === undefined ? undefined : null };
  }

  private present(activity: Activity): Activity {
    return Object.assign(activity, { price: activity.priceMinor && activity.priceCurrency ? minorToDecimal(activity.priceMinor, activity.priceCurrency) : undefined });
  }

  private assertFinancialParticipants(trip: { userId: string; members: Array<{ userId: string }> }, dto: CreateActivityDto | UpdateActivityDto) {
    const allowed = new Set([trip.userId, ...trip.members.map((member) => member.userId)]);
    const ids = [...(dto.financialParticipantUserIds ?? []), ...(dto.financialPayerUserId ? [dto.financialPayerUserId] : [])];
    if (ids.some((id) => !allowed.has(id))) throw new ForbiddenException('Financial participants must belong to the trip');
  }
}
