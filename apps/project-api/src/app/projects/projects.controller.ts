import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto, GranularUpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from './entities/project.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.projectsService.getProjectStats();
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  runSeed() {
    return this.projectsService.runSeed();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: ProjectStatus) {
    return this.projectsService.findByStatus(status);
  }

  @Get('business-unit/:businessUnit')
  findByBusinessUnit(@Param('businessUnit') businessUnit: string) {
    return this.projectsService.findByBusinessUnit(businessUnit);
  }

  @Get('technologies')
  findAllTechnologies() {
    return this.projectsService.findAllTechnologies();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/granular')
  granularUpdate(@Param('id') id: string, @Body() granularUpdateDto: GranularUpdateProjectDto) {
    return this.projectsService.granularUpdate(id, granularUpdateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
} 