import { IsEnum } from 'class-validator';
import { TripMemberRole } from '../entities/trip-member.entity';

export class UpdateTripMemberDto {
  @IsEnum(TripMemberRole)
  role: TripMemberRole;
}
