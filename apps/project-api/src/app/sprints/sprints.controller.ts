import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Controller('projects/:projectId/sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintsService.create(projectId, dto);
  }

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.sprintsService.findByProject(projectId);
  }

  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.sprintsService.findOne(projectId, id);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintsService.update(projectId, id, dto);
  }

  @Patch(':id/activate')
  activate(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.sprintsService.activate(projectId, id);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.sprintsService.remove(projectId, id);
  }
}

