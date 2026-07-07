import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelDay } from './entities/travel-day.entity';
import { TripsService } from '../trips/trips.service';
import { UpsertTravelDayDto } from './dto/upsert-travel-day.dto';

@Injectable()
export class TravelDaysService {
  constructor(
    @InjectRepository(TravelDay)
    private readonly travelDaysRepository: Repository<TravelDay>,
    private readonly tripsService: TripsService,
  ) {}

  async findAll(userId: string, tripId: string): Promise<TravelDay[]> {
    await this.tripsService.findOne(userId, tripId);
    return this.travelDaysRepository.find({
      where: { tripId },
      order: { date: 'ASC' },
    });
  }

  async upsert(userId: string, tripId: string, dto: UpsertTravelDayDto): Promise<TravelDay> {
    await this.tripsService.findOne(userId, tripId);
    const existing = await this.travelDaysRepository.findOne({
      where: { tripId, date: dto.date },
    });
    if (existing) {
      Object.assign(existing, dto);
      return this.travelDaysRepository.save(existing);
    }
    const day = this.travelDaysRepository.create({ ...dto, tripId });
    return this.travelDaysRepository.save(day);
  }

  async remove(userId: string, tripId: string, date: string): Promise<void> {
    await this.tripsService.findOne(userId, tripId);
    await this.travelDaysRepository.delete({ tripId, date });
  }
}
