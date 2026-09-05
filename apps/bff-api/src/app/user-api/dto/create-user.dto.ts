import { ArrayNotEmpty, IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import type { UserRole } from '../user-api.client';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['user', 'admin'], { each: true })
  roles?: UserRole[];

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;
}
