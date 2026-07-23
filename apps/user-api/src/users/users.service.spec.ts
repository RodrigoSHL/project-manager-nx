import { ConflictException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService creation', () => {
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
  };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn(),
      findOneBy: jest.fn(),
    };
    service = new UsersService(repository as unknown as Repository<User>);
  });

  it('normalizes email and name before saving', async () => {
    const saved = {
      id: 'user-1',
      email: 'new@example.com',
      name: 'New User',
      roles: ['user'],
    };
    repository.save.mockResolvedValue(saved);
    repository.findOneBy.mockResolvedValue(saved);

    await expect(service.create({
      email: '  NEW@Example.com ',
      name: ' New User ',
    })).resolves.toEqual(saved);
    expect(repository.create).toHaveBeenCalledWith({
      email: 'new@example.com',
      name: 'New User',
    });
  });

  it('returns a conflict for a duplicated email', async () => {
    const driverError = Object.assign(new Error('duplicate key'), { code: '23505' });
    repository.save.mockRejectedValue(new QueryFailedError('INSERT', [], driverError));

    await expect(service.create({
      email: 'existing@example.com',
      name: 'Existing',
    })).rejects.toBeInstanceOf(ConflictException);
  });
});
