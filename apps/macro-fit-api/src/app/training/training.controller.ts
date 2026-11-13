import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createTrainingRoutineSchema,
  customTrainingExerciseSchema,
  finishTrainingSchema,
  saveTrainingDraftSchema,
  trainingHistoryQuerySchema,
  trainingSessionIdSchema,
  updateCompletedTrainingSchema,
} from '@project-manager/macrofit-contracts';
import {
  InternalAuthGuard,
  parseInput,
} from '../nutrition/nutrition.controller';
import { TrainingService } from './training.service';

@Controller('me/training')
@UseGuards(InternalAuthGuard)
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  workspace(@Headers('x-user-id') userId: string) {
    return this.service.workspace(userId);
  }

  @Put('draft')
  saveDraft(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.saveDraft(
      userId,
      parseInput(saveTrainingDraftSchema, body)
    );
  }

  @Post('finish')
  @HttpCode(200)
  finish(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.finish(userId, parseInput(finishTrainingSchema, body));
  }

  @Get('history')
  @Header('Cache-Control', 'no-store')
  history(@Headers('x-user-id') userId: string, @Query() query: unknown) {
    const { offset, from, to } = parseInput(trainingHistoryQuerySchema, query);
    return this.service.history(userId, Number(offset ?? 0), from, to);
  }

  @Put('history/:id')
  editSession(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.service.editSession(
      userId,
      parseInput(trainingSessionIdSchema, id),
      parseInput(updateCompletedTrainingSchema, body)
    );
  }

  @Post('exercises')
  createExercise(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.createExercise(
      userId,
      parseInput(customTrainingExerciseSchema, body)
    );
  }

  @Post('routines')
  createRoutine(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.createRoutine(
      userId,
      parseInput(createTrainingRoutineSchema, body)
    );
  }
}
