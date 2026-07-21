import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';
import { CreateChecklistItemDto, CreateTravelDocumentDto, CreateTravelerResourceDto, LinkDocumentDto, ListDocumentsDto, RevealDocumentNumberDto, UpdateChecklistItemDto, UpdateTravelDocumentDto, UpdateTravelerProfileDto, UpdateTravelerResourceDto } from './dto/traveler-profile.dto';
import { TravelerResourceKind } from './entities/traveler-resource.entity';
import { TravelerProfileService } from './traveler-profile.service';

@UseGuards(InternalAuthGuard)
@Controller('traveler-profile')
export class TravelerProfileController {
  constructor(private readonly service:TravelerProfileService){}
  @Get() profile(@CurrentUser() user:RequestUser){return this.service.getProfile(user.id)}
  @Patch() updateProfile(@CurrentUser() user:RequestUser,@Body() dto:UpdateTravelerProfileDto){return this.service.updateProfile(user.id,dto)}
  @Get('dashboard') dashboard(@CurrentUser() user:RequestUser){return this.service.dashboard(user.id)}
  @Get('documents') documents(@CurrentUser() user:RequestUser,@Query() query:ListDocumentsDto){return this.service.listDocuments(user.id,query)}
  @Post('documents') createDocument(@CurrentUser() user:RequestUser,@Body() dto:CreateTravelDocumentDto){return this.service.createDocument(user.id,dto)}
  @Get('documents/:id') document(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.service.getDocument(user.id,id)}
  @Patch('documents/:id') updateDocument(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() dto:UpdateTravelDocumentDto){return this.service.updateDocument(user.id,id,dto)}
  @Post('documents/:id/reveal') reveal(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() dto:RevealDocumentNumberDto){return this.service.revealNumber(user.id,id,dto.confirm)}
  @Delete('documents/:id') @HttpCode(HttpStatus.NO_CONTENT) removeDocument(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.service.deleteDocument(user.id,id)}
  @Get('resources') resources(@CurrentUser() user:RequestUser,@Query('kind') kind?:TravelerResourceKind){return this.service.listResources(user.id,kind)}
  @Post('resources') createResource(@CurrentUser() user:RequestUser,@Body() dto:CreateTravelerResourceDto){return this.service.createResource(user.id,dto)}
  @Patch('resources/:id') updateResource(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() dto:UpdateTravelerResourceDto){return this.service.updateResource(user.id,id,dto)}
  @Delete('resources/:id') @HttpCode(HttpStatus.NO_CONTENT) removeResource(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.service.deleteResource(user.id,id)}
  @Get('trips/:tripId/documents') tripDocuments(@CurrentUser() user:RequestUser,@Param('tripId') tripId:string){return this.service.documentsForTrip(user.id,tripId)}
  @Post('trips/:tripId/documents') link(@CurrentUser() user:RequestUser,@Param('tripId') tripId:string,@Body() dto:LinkDocumentDto){return this.service.linkDocument(user.id,tripId,dto.documentId)}
  @Delete('trips/:tripId/documents/:documentId') @HttpCode(HttpStatus.NO_CONTENT) unlink(@CurrentUser() user:RequestUser,@Param('tripId') tripId:string,@Param('documentId') documentId:string){return this.service.unlinkDocument(user.id,tripId,documentId)}
  @Get('trips/:tripId/checklist') checklist(@CurrentUser() user:RequestUser,@Param('tripId') tripId:string){return this.service.getChecklist(user.id,tripId)}
  @Post('trips/:tripId/checklist') addChecklist(@CurrentUser() user:RequestUser,@Param('tripId') tripId:string,@Body() dto:CreateChecklistItemDto){return this.service.addChecklist(user.id,tripId,dto)}
  @Patch('trips/:tripId/checklist/:id') updateChecklist(@CurrentUser() user:RequestUser,@Param('tripId') tripId:string,@Param('id') id:string,@Body() dto:UpdateChecklistItemDto){return this.service.updateChecklist(user.id,tripId,id,dto)}
}
