import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { TravelApiClient } from './travel-api.client';

type BodyData = Record<string, unknown>;

@UseGuards(JwtAuthGuard)
@Controller('api/traveler-profile')
export class TravelerProfileApiController {
  constructor(private readonly client: TravelApiClient) {}

  @Get()
  profile(@Request() req: ExpressRequestWithUser) {
    return this.client.travelerGet('', req.user);
  }

  @Patch()
  updateProfile(
    @Request() req: ExpressRequestWithUser,
    @Body() body: BodyData
  ) {
    return this.client.travelerPatch('', body, req.user);
  }

  @Get('dashboard')
  dashboard(@Request() req: ExpressRequestWithUser) {
    return this.client.travelerGet('/dashboard', req.user);
  }

  @Get('documents')
  documents(
    @Request() req: ExpressRequestWithUser,
    @Query() query: Record<string, string>
  ) {
    return this.client.travelerGet(this.withQuery('/documents', query), req.user);
  }

  @Post('documents')
  createDocument(
    @Request() req: ExpressRequestWithUser,
    @Body() body: BodyData
  ) {
    return this.client.travelerPost('/documents', body, req.user);
  }

  @Get('documents/:id')
  document(
    @Request() req: ExpressRequestWithUser,
    @Param('id') id: string
  ) {
    return this.client.travelerGet(`/documents/${id}`, req.user);
  }

  @Patch('documents/:id')
  updateDocument(
    @Request() req: ExpressRequestWithUser,
    @Param('id') id: string,
    @Body() body: BodyData
  ) {
    return this.client.travelerPatch(`/documents/${id}`, body, req.user);
  }

  @Post('documents/:id/reveal')
  revealDocument(
    @Request() req: ExpressRequestWithUser,
    @Param('id') id: string,
    @Body() body: BodyData
  ) {
    return this.client.travelerPost(`/documents/${id}/reveal`, body, req.user);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDocument(
    @Request() req: ExpressRequestWithUser,
    @Param('id') id: string
  ) {
    return this.client.travelerDelete(`/documents/${id}`, req.user);
  }

  @Get('resources')
  resources(
    @Request() req: ExpressRequestWithUser,
    @Query() query: Record<string, string>
  ) {
    return this.client.travelerGet(this.withQuery('/resources', query), req.user);
  }

  @Post('resources')
  createResource(
    @Request() req: ExpressRequestWithUser,
    @Body() body: BodyData
  ) {
    return this.client.travelerPost('/resources', body, req.user);
  }

  @Patch('resources/:id')
  updateResource(
    @Request() req: ExpressRequestWithUser,
    @Param('id') id: string,
    @Body() body: BodyData
  ) {
    return this.client.travelerPatch(`/resources/${id}`, body, req.user);
  }

  @Delete('resources/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteResource(
    @Request() req: ExpressRequestWithUser,
    @Param('id') id: string
  ) {
    return this.client.travelerDelete(`/resources/${id}`, req.user);
  }

  @Get('trips/:tripId/documents')
  tripDocuments(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string
  ) {
    return this.client.travelerGet(`/trips/${tripId}/documents`, req.user);
  }

  @Post('trips/:tripId/documents')
  linkDocument(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() body: BodyData
  ) {
    return this.client.travelerPost(`/trips/${tripId}/documents`, body, req.user);
  }

  @Delete('trips/:tripId/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkDocument(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('documentId') documentId: string
  ) {
    return this.client.travelerDelete(
      `/trips/${tripId}/documents/${documentId}`,
      req.user
    );
  }

  @Get('trips/:tripId/checklist')
  checklist(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string
  ) {
    return this.client.travelerGet(`/trips/${tripId}/checklist`, req.user);
  }

  @Post('trips/:tripId/checklist')
  createChecklistItem(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() body: BodyData
  ) {
    return this.client.travelerPost(
      `/trips/${tripId}/checklist`,
      body,
      req.user
    );
  }

  @Patch('trips/:tripId/checklist/:id')
  updateChecklistItem(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: BodyData
  ) {
    return this.client.travelerPatch(
      `/trips/${tripId}/checklist/${id}`,
      body,
      req.user
    );
  }

  private withQuery(path: string, query: Record<string, string>): string {
    const values = Object.entries(query).filter(([, value]) => value !== '');
    return values.length ? `${path}?${new URLSearchParams(values)}` : path;
  }
}
