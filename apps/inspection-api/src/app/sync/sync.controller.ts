import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActiveTenantGuard } from '../catalog/guards/active-tenant.guard';
import { SyncPushRequestDto } from './dto/sync-push.dto';
import { SyncService } from './sync.service';

@Controller('tenants/:tenantId/sync')
@UseGuards(ActiveTenantGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('push')
  push(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() dto: SyncPushRequestDto
  ) {
    return this.sync.push(tenantId, dto);
  }
}
