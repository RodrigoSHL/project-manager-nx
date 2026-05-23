import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subtask } from './entities/subtask.entity';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Injectable()
export class SubtasksService {
  constructor(
    @InjectRepository(Subtask)
    private readonly subtasksRepository: Repository<Subtask>,
  ) {}

  async create(ticketId: string, dto: CreateSubtaskDto): Promise<Subtask> {
    const subtask = this.subtasksRepository.create({ ...dto, ticketId });
    return this.subtasksRepository.save(subtask);
  }

  findByTicket(ticketId: string): Promise<Subtask[]> {
    return this.subtasksRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(ticketId: string, id: string): Promise<Subtask> {
    const subtask = await this.subtasksRepository.findOne({ where: { id, ticketId } });
    if (!subtask) throw new NotFoundException(`Subtask ${id} not found`);
    return subtask;
  }

  async update(ticketId: string, id: string, dto: UpdateSubtaskDto): Promise<Subtask> {
    const subtask = await this.findOne(ticketId, id);
    Object.assign(subtask, dto);
    return this.subtasksRepository.save(subtask);
  }

  async remove(ticketId: string, id: string): Promise<void> {
    const subtask = await this.findOne(ticketId, id);
    await this.subtasksRepository.remove(subtask);
  }
}
