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

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    private readonly tripsService: TripsService,
  ) {}

  async create(userId: string, tripId: string, dto: CreateActivityDto): Promise<Activity> {
    await this.tripsService.findOne(userId, tripId); // validates ownership
    const activity = this.activitiesRepository.create({ ...dto, tripId, countries: dto.countries ?? [] });
    return this.activitiesRepository.save(activity);
  }

  async findAll(userId: string, tripId: string): Promise<Activity[]> {
    await this.tripsService.findOne(userId, tripId);
    return this.activitiesRepository.find({
      where: { tripId },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(userId: string, tripId: string, id: string): Promise<Activity> {
    await this.tripsService.findOne(userId, tripId);
    const activity = await this.activitiesRepository.findOne({ where: { id, tripId } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async update(userId: string, tripId: string, id: string, dto: UpdateActivityDto): Promise<Activity> {
    const activity = await this.findOne(userId, tripId, id);
    Object.assign(activity, dto);
    return this.activitiesRepository.save(activity);
  }

  async remove(userId: string, tripId: string, id: string): Promise<void> {
    const activity = await this.findOne(userId, tripId, id);
    await this.activitiesRepository.remove(activity);
  }
}
