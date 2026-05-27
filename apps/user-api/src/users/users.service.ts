import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const existingUser = await this.usersRepo.findOneBy({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      ...dto,
      email: normalizedEmail,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepo.save(user);
    return this.findOne(savedUser.id);
  }

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    const updatePayload: Partial<User> = { ...dto };

    if (dto.email) {
      updatePayload.email = this.normalizeEmail(dto.email);
    }

    if (dto.password) {
      updatePayload.password = await bcrypt.hash(dto.password, 10);
    }

    await this.usersRepo.update(id, updatePayload);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.usersRepo.delete(id);
  }
}
