import { IsBoolean } from 'class-validator';

export class SetWorkTypeRuleDto {
  @IsBoolean()
  enabled!: boolean;
}
