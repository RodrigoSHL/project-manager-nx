import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLuggageDto, UpdateLuggageDto } from './dto/luggage.dto';
import { Luggage } from './entities/luggage.entity';

@Injectable()
export class LuggageService {
  constructor(
    @InjectRepository(Luggage)
    private readonly luggageRepository: Repository<Luggage>,
  ) {}

  create(ownerId: string, dto: CreateLuggageDto): Promise<Luggage> {
    return this.luggageRepository.save(this.luggageRepository.create({ ...dto, ownerId }));
  }

  findAll(ownerId: string, includeArchived = false): Promise<Luggage[]> {
    return this.luggageRepository.find({
      where: includeArchived ? { ownerId } : { ownerId, archived: false },
      relations: ['tripAssignments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOwned(ownerId: string, id: string): Promise<Luggage> {
    const luggage = await this.luggageRepository.findOne({ where: { id }, relations: ['tripAssignments'] });
    if (!luggage) throw new NotFoundException('Luggage not found');
    if (luggage.ownerId !== ownerId) throw new ForbiddenException('You can only modify your own luggage');
    return luggage;
  }

  async update(ownerId: string, id: string, dto: UpdateLuggageDto): Promise<Luggage> {
    const luggage = await this.findOwned(ownerId, id);
    Object.assign(luggage, dto);
    return this.luggageRepository.save(luggage);
  }

  async duplicate(ownerId: string, id: string): Promise<Luggage> {
    const source = await this.findOwned(ownerId, id);
    return this.luggageRepository.save(
      this.luggageRepository.create({
        ownerId: source.ownerId,
        name: `${source.name} (copia)`,
        type: source.type,
        image: source.image,
        color: source.color,
        brand: source.brand,
        model: source.model,
        capacityLiters: source.capacityLiters,
        emptyWeight: source.emptyWeight,
        maxWeight: source.maxWeight,
        dimensions: source.dimensions,
        cabinCompatible: source.cabinCompatible,
        personalItemCompatible: source.personalItemCompatible,
        checkedBaggage: source.checkedBaggage,
        notes: source.notes,
        archived: false,
      }),
    );
  }

  async archive(ownerId: string, id: string): Promise<Luggage> {
    const luggage = await this.findOwned(ownerId, id);
    const activeAssignments = luggage.tripAssignments?.length ?? 0;
    if (activeAssignments > 0) {
      throw new ConflictException('Remove this luggage from its trips before archiving it');
    }
    luggage.archived = true;
    return this.luggageRepository.save(luggage);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const luggage = await this.findOwned(ownerId, id);
    await this.luggageRepository.remove(luggage);
  }
}
