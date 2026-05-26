import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubtasksService } from './subtasks.service';
import { SubtasksController } from './subtasks.controller';
import { Subtask } from './entities/subtask.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subtask])],
  controllers: [SubtasksController],
  providers: [SubtasksService],
  exports: [SubtasksService],
})
export class SubtasksModule {}
