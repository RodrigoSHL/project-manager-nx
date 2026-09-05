import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService access queries', () => {
  let repository: {
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    innerJoin: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
  };
  let service: WorkspacesService;

  beforeEach(() => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    service = new WorkspacesService(repository as unknown as Repository<Workspace>);
  });

  it('returns only workspaces linked through workspace membership', async () => {
    const workspaces = [{ id: 'workspace-1', name: 'Workspace 1' }];
    queryBuilder.getMany.mockResolvedValue(workspaces);

    await expect(service.findForUser('user-1')).resolves.toEqual(workspaces);

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('workspace');
    expect(queryBuilder.where).toHaveBeenCalledWith('member.userId = :userId', {
      userId: 'user-1',
    });
  });
});
