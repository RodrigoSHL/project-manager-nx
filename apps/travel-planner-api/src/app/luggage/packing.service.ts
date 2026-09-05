import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddTripLuggageDto, CreatePackingItemDto, GeneratePackingListDto, PackingActivity, UpdatePackingItemDto, UpdateTripLuggageDto } from './dto/packing.dto';
import { BaggagePolicy, PackingItem, PackingItemStatus } from './entities/packing-item.entity';
import { TripLuggage } from './entities/trip-luggage.entity';
import { LuggageService } from './luggage.service';
import { PackingRecommendationEngine } from './rules/packing-recommendation.engine';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class PackingService {
  constructor(
    @InjectRepository(TripLuggage)
    private readonly tripLuggageRepository: Repository<TripLuggage>,
    @InjectRepository(PackingItem)
    private readonly packingItemRepository: Repository<PackingItem>,
    private readonly luggageService: LuggageService,
    private readonly tripsService: TripsService,
    private readonly recommendationEngine: PackingRecommendationEngine,
  ) {}

  async listTripLuggage(userId: string, tripId: string): Promise<TripLuggage[]> {
    await this.tripsService.findOne(userId, tripId);
    return this.tripLuggageRepository.find({
      where: { tripId, ownerId: userId },
      relations: ['luggage', 'items'],
      order: { createdAt: 'ASC' },
    });
  }

  async addTripLuggage(userId: string, tripId: string, dto: AddTripLuggageDto): Promise<TripLuggage> {
    await this.tripsService.findOne(userId, tripId);
    const luggage = await this.luggageService.findOwned(userId, dto.luggageId);
    if (luggage.archived) throw new ConflictException('Archived luggage cannot be added to a trip');
    const existing = await this.tripLuggageRepository.findOneBy({ tripId, luggageId: luggage.id });
    if (existing) throw new ConflictException('This luggage is already selected for the trip');
    return this.tripLuggageRepository.save(
      this.tripLuggageRepository.create({ tripId, luggageId: luggage.id, ownerId: userId }),
    );
  }

  async updateTripLuggage(userId: string, tripId: string, id: string, dto: UpdateTripLuggageDto): Promise<TripLuggage> {
    const assignment = await this.findOwnedTripLuggage(userId, tripId, id);
    Object.assign(assignment, dto);
    return this.tripLuggageRepository.save(assignment);
  }

  async removeTripLuggage(userId: string, tripId: string, id: string): Promise<void> {
    const assignment = await this.findOwnedTripLuggage(userId, tripId, id);
    await this.packingItemRepository.update({ tripId, luggageId: id }, { luggageId: null });
    await this.tripLuggageRepository.remove(assignment);
  }

  async listItems(userId: string, tripId: string): Promise<PackingItem[]> {
    await this.tripsService.findOne(userId, tripId);
    return this.packingItemRepository.find({
      where: [
        { tripId, userId },
        { tripId, shared: true, private: false },
      ],
      relations: ['tripLuggage', 'tripLuggage.luggage'],
      order: { category: 'ASC', priority: 'ASC', name: 'ASC' },
    });
  }

  async createItem(userId: string, tripId: string, dto: CreatePackingItemDto): Promise<PackingItem> {
    await this.tripsService.findOne(userId, tripId);
    if (dto.luggageId) await this.assertOwnedTripLuggage(userId, tripId, dto.luggageId);
    const item = this.packingItemRepository.create({
      ...dto,
      tripId,
      userId,
      responsibleUserId: dto.responsibleUserId ?? userId,
      source: 'manual',
      purchaseRequired: dto.purchaseRequired ?? false,
      status: dto.purchaseRequired ? PackingItemStatus.TO_BUY : dto.status,
    });
    return this.packingItemRepository.save(item);
  }

  async updateItem(userId: string, tripId: string, id: string, dto: UpdatePackingItemDto): Promise<PackingItem> {
    const item = await this.findEditableItem(userId, tripId, id);
    if (dto.luggageId) await this.assertOwnedTripLuggage(userId, tripId, dto.luggageId);
    Object.assign(item, dto);
    if (dto.purchaseRequired === true) item.status = PackingItemStatus.TO_BUY;
    if (dto.packed === true) item.haveIt = true;
    return this.packingItemRepository.save(item);
  }

  async removeItem(userId: string, tripId: string, id: string): Promise<void> {
    const item = await this.findEditableItem(userId, tripId, id);
    await this.packingItemRepository.remove(item);
  }

  async generate(userId: string, tripId: string, dto: GeneratePackingListDto): Promise<PackingItem[]> {
    const trip = await this.tripsService.findOne(userId, tripId);
    const luggage = (await this.listTripLuggage(userId, tripId)).filter((entry) => entry.ownerId === userId);
    if (luggage.length === 0) throw new BadRequestException('Select at least one luggage item before generating the list');

    const existingCount = await this.packingItemRepository.countBy({ tripId, userId });
    if (existingCount > 0 && !dto.replaceExisting) {
      throw new ConflictException('A packing list already exists. Confirm replacement to generate it again');
    }
    if (dto.replaceExisting) await this.packingItemRepository.delete({ tripId, userId });

    const days = dto.customDays ?? this.calculateTripDays(trip.startDate, trip.endDate);
    const inferredActivities = this.inferActivities(trip.activities.map((activity) => `${activity.type} ${activity.title}`));
    const recommendations = this.recommendationEngine.generate({
      ...dto,
      days,
      activities: [...new Set([...dto.activities, ...inferredActivities])],
      luggage,
    });

    return this.packingItemRepository.save(
      recommendations.map((recommendation) =>
        this.packingItemRepository.create({
          ...recommendation,
          tripId,
          userId,
          responsibleUserId: userId,
        }),
      ),
    );
  }

  async dashboard(userId: string, tripId: string) {
    const [items, luggage] = await Promise.all([this.listItems(userId, tripId), this.listTripLuggage(userId, tripId)]);
    const activeItems = items.filter((item) => item.status !== PackingItemStatus.SKIPPED);
    const totals = {
      total: activeItems.length,
      haveIt: activeItems.filter((item) => item.haveIt).length,
      packed: activeItems.filter((item) => item.packed).length,
      toBuy: activeItems.filter((item) => item.purchaseRequired || item.status === PackingItemStatus.TO_BUY).length,
      unassigned: activeItems.filter((item) => !item.luggageId).length,
      beforeLeaving: activeItems.filter((item) => item.packMoment === 'before_leaving' && !item.packed).length,
    };
    const luggageSummary = luggage.map((entry) => {
      const assigned = activeItems.filter((item) => item.luggageId === entry.id);
      const contentsWeight = assigned.reduce((sum, item) => sum + (item.actualWeight ?? item.estimatedWeight), 0);
      const estimatedWeight = Math.round((entry.luggage.emptyWeight + contentsWeight) * 100) / 100;
      const maxWeight = entry.maxWeightOverride ?? entry.luggage.maxWeight;
      const warnings: string[] = [];
      if (maxWeight && estimatedWeight > maxWeight) warnings.push(`Peso estimado ${estimatedWeight} kg supera el máximo configurado de ${maxWeight} kg.`);
      if (entry.luggage.cabinCompatible && assigned.some((item) => item.cabinPolicy === BaggagePolicy.PROHIBITED)) {
        warnings.push('Hay artículos asignados que no deberían viajar en cabina.');
      }
      return {
        ...entry,
        itemCount: assigned.length,
        packedCount: assigned.filter((item) => item.packed).length,
        progress: assigned.length ? Math.round((assigned.filter((item) => item.packed).length / assigned.length) * 100) : 0,
        estimatedWeight,
        maxWeight,
        warnings,
      };
    });
    return { totals, luggage: luggageSummary, airlineNotice: 'Confirma las dimensiones, peso y artículos permitidos directamente con tu aerolínea antes de viajar.' };
  }

  private async findOwnedTripLuggage(userId: string, tripId: string, id: string): Promise<TripLuggage> {
    await this.tripsService.findOne(userId, tripId);
    const assignment = await this.tripLuggageRepository.findOne({ where: { id, tripId }, relations: ['luggage'] });
    if (!assignment) throw new NotFoundException('Trip luggage not found');
    if (assignment.ownerId !== userId) throw new ForbiddenException('You can only modify your own luggage');
    return assignment;
  }

  private async findEditableItem(userId: string, tripId: string, id: string): Promise<PackingItem> {
    await this.tripsService.findOne(userId, tripId);
    const item = await this.packingItemRepository.findOneBy({ id, tripId });
    if (!item) throw new NotFoundException('Packing item not found');
    if (item.userId !== userId) {
      if (!item.shared || item.private) throw new ForbiddenException('This item is private');
      await this.tripsService.assertCanEdit(userId, tripId);
    }
    return item;
  }

  private async assertOwnedTripLuggage(userId: string, tripId: string, id: string): Promise<void> {
    const exists = await this.tripLuggageRepository.exist({ where: { id, tripId, ownerId: userId } });
    if (!exists) throw new BadRequestException('Selected luggage does not belong to you in this trip');
  }

  private calculateTripDays(startDate?: string, endDate?: string): number {
    if (!startDate || !endDate) return 7;
    return Math.max(1, Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1);
  }

  private inferActivities(values: string[]): PackingActivity[] {
    const text = values.join(' ').toLowerCase();
    const inferred: PackingActivity[] = [];
    if (/sightseeing|food|shopping/.test(text)) inferred.push(PackingActivity.CITY);
    if (/running|run |trote/.test(text)) inferred.push(PackingActivity.RUNNING);
    if (/hiking|senderismo|caminata/.test(text)) inferred.push(PackingActivity.HIKING);
    if (/work|trabajo/.test(text)) inferred.push(PackingActivity.WORK);
    return inferred;
  }
}
