import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const { password, ...userData } = dto;
    const user = this.usersRepo.create({
      ...userData,
      email: dto.email.trim().toLowerCase(),
      name: dto.name.trim(),
    });

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    let savedUser: User;
    try {
      savedUser = await this.usersRepo.save(user);
    } catch (error) {
      this.rethrowUserConflict(error);
    }
    return this.findOne(savedUser.id);
  }

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findByEmail(email: string): Promise<User> {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = normalizedEmail
      ? await this.usersRepo
          .createQueryBuilder('user')
          .where('LOWER(user.email) = :email', { email: normalizedEmail })
          .getOne()
      : null;

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    const { password, ...userData } = dto;
    const updateData: Partial<User> = {
      ...userData,
      ...(dto.email ? { email: dto.email.trim().toLowerCase() } : {}),
      ...(dto.name ? { name: dto.name.trim() } : {}),
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
      await this.usersRepo.update(id, updateData);
    } catch (error) {
      this.rethrowUserConflict(error);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.usersRepo.delete(id);
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = normalizedEmail
      ? await this.usersRepo
          .createQueryBuilder('user')
          .addSelect('user.passwordHash')
          .where('LOWER(user.email) = :email', { email: normalizedEmail })
          .getOne()
      : null;

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    delete user.passwordHash;
    return user;
  }

  private rethrowUserConflict(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };
      if (driverError.code === '23505') {
        throw new ConflictException('A user with this email already exists');
      }
    }

    throw error;
  }
}
