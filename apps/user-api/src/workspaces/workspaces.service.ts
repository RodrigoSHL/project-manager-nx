import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './entities/workspace.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspacesRepo: Repository<Workspace>,
  ) {}

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const existing = await this.workspacesRepo.findOneBy({ slug: dto.slug });
    if (existing) throw new ConflictException(`Slug '${dto.slug}' is already taken`);
    const workspace = this.workspacesRepo.create(dto);
    return this.workspacesRepo.save(workspace);
  }

  findAll(): Promise<Workspace[]> {
    return this.workspacesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Workspace> {
    const workspace = await this.workspacesRepo.findOneBy({ id });
    if (!workspace) throw new NotFoundException(`Workspace ${id} not found`);
    return workspace;
  }

  async findBySlug(slug: string): Promise<Workspace> {
    const workspace = await this.workspacesRepo.findOneBy({ slug });
    if (!workspace) throw new NotFoundException(`Workspace '${slug}' not found`);
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    await this.findOne(id);
    if (dto.slug) {
      const existing = await this.workspacesRepo.findOneBy({ slug: dto.slug });
      if (existing && existing.id !== id) throw new ConflictException(`Slug '${dto.slug}' is already taken`);
    }
    await this.workspacesRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.workspacesRepo.delete(id);
  }
}
