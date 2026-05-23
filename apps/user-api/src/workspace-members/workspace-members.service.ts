import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { WorkspaceMember } from './entities/workspace-member.entity';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly membersRepo: Repository<WorkspaceMember>,
  ) {}

  async addMember(workspaceId: string, dto: CreateWorkspaceMemberDto): Promise<WorkspaceMember> {
    const existing = await this.membersRepo.findOneBy({ workspaceId, userId: dto.userId });
    if (existing) throw new ConflictException('User is already a member of this workspace');
    const member = this.membersRepo.create({ workspaceId, ...dto });
    return this.membersRepo.save(member);
  }

  findByWorkspace(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.membersRepo.find({
      where: { workspaceId },
      order: { joinedAt: 'ASC' },
    });
  }

  async updateRole(workspaceId: string, userId: string, dto: UpdateWorkspaceMemberDto): Promise<WorkspaceMember> {
    const member = await this.membersRepo.findOneBy({ workspaceId, userId });
    if (!member) throw new NotFoundException('Member not found in this workspace');
    member.role = dto.role;
    return this.membersRepo.save(member);
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const member = await this.membersRepo.findOneBy({ workspaceId, userId });
    if (!member) throw new NotFoundException('Member not found in this workspace');
    await this.membersRepo.delete(member.id);
  }
}
