import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { TripMemberRole } from '../entities/trip-member.entity';

export class ShareTripDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(TripMemberRole)
  role?: TripMemberRole;
}
