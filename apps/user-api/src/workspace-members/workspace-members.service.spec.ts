import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';
import { WorkspaceMembersService } from './workspace-members.service';

describe('workspace member role updates', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const validate = (body: unknown) => pipe.transform(body, {
    type: 'body', metatype: UpdateWorkspaceMemberDto,
  });

  it.each(Object.values(WorkspaceRole))('accepts the workspace role %s', async role => {
    await expect(validate({ role })).resolves.toEqual({ role });
  });

  it.each([{}, { role: null }, { role: 'analyst' }, { role: 'admin', userId: 'other-user' }])(
    'rejects an invalid role update %j without applying a default', async body => {
      await expect(validate(body)).rejects.toBeInstanceOf(BadRequestException);
    }
  );

  it('updates only the membership identified by both workspace and user', async () => {
    const member = {
      id: 'membership-1', workspaceId: 'workspace-1', userId: 'user-1',
      role: WorkspaceRole.MEMBER, joinedAt: new Date(),
    };
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(member),
      save: jest.fn().mockImplementation(async value => value),
    };
    const service = new WorkspaceMembersService(repository as unknown as Repository<WorkspaceMember>);

    await expect(service.updateRole('workspace-1', 'user-1', { role: WorkspaceRole.VIEWER }))
      .resolves.toEqual({ ...member, role: WorkspaceRole.VIEWER });
    expect(repository.findOneBy).toHaveBeenCalledWith({ workspaceId: 'workspace-1', userId: 'user-1' });
    expect(repository.save).toHaveBeenCalledWith({ ...member, role: WorkspaceRole.VIEWER });
  });

  it('does not create a membership when the user does not belong to that workspace', async () => {
    const repository = { findOneBy: jest.fn().mockResolvedValue(null), save: jest.fn() };
    const service = new WorkspaceMembersService(repository as unknown as Repository<WorkspaceMember>);
    await expect(service.updateRole('other-workspace', 'user-1', { role: WorkspaceRole.ADMIN }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
