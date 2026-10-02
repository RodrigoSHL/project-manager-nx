import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds!: string[];
}
