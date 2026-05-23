import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from './entities/sprint.entity';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
  ) {}

  async create(projectId: string, dto: CreateSprintDto): Promise<Sprint> {
    const sprint = this.sprintsRepository.create({ ...dto, projectId });
    return this.sprintsRepository.save(sprint);
  }

  findByProject(projectId: string): Promise<Sprint[]> {
    return this.sprintsRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(projectId: string, id: string): Promise<Sprint> {
    const sprint = await this.sprintsRepository.findOne({ where: { id, projectId } });
    if (!sprint) throw new NotFoundException(`Sprint ${id} not found`);
    return sprint;
  }

  async update(projectId: string, id: string, dto: UpdateSprintDto): Promise<Sprint> {
    const sprint = await this.findOne(projectId, id);
    Object.assign(sprint, dto);
    return this.sprintsRepository.save(sprint);
  }

  async activate(projectId: string, id: string): Promise<Sprint> {
    const sprint = await this.findOne(projectId, id);
    if (sprint.isActive) throw new ConflictException('Sprint is already active');

    // Desactivar todos los sprints activos del proyecto
    await this.sprintsRepository.update({ projectId, isActive: true }, { isActive: false });

    sprint.isActive = true;
    return this.sprintsRepository.save(sprint);
  }

  async remove(projectId: string, id: string): Promise<void> {
    const sprint = await this.findOne(projectId, id);
    await this.sprintsRepository.remove(sprint);
  }
}

