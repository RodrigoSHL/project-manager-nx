import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelsRepository: Repository<Label>,
  ) {}

  async create(projectId: string, dto: CreateLabelDto): Promise<Label> {
    const existing = await this.labelsRepository.findOne({ where: { projectId, name: dto.name } });
    if (existing) throw new ConflictException(`Label '${dto.name}' already exists in this project`);
    const label = this.labelsRepository.create({ ...dto, projectId });
    return this.labelsRepository.save(label);
  }

  findByProject(projectId: string): Promise<Label[]> {
    return this.labelsRepository.find({ where: { projectId }, order: { name: 'ASC' } });
  }

  async findOne(projectId: string, id: string): Promise<Label> {
    const label = await this.labelsRepository.findOne({ where: { id, projectId } });
    if (!label) throw new NotFoundException(`Label ${id} not found`);
    return label;
  }

  async update(projectId: string, id: string, dto: UpdateLabelDto): Promise<Label> {
    const label = await this.findOne(projectId, id);
    if (dto.name && dto.name !== label.name) {
      const existing = await this.labelsRepository.findOne({ where: { projectId, name: dto.name } });
      if (existing) throw new ConflictException(`Label '${dto.name}' already exists in this project`);
    }
    Object.assign(label, dto);
    return this.labelsRepository.save(label);
  }

  async remove(projectId: string, id: string): Promise<void> {
    const label = await this.findOne(projectId, id);
    await this.labelsRepository.remove(label);
  }
}
