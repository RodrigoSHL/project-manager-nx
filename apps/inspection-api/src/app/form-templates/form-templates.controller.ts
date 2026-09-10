import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateFormItemDto } from './dto/create-form-item.dto';
import { CreateFormSectionDto } from './dto/create-form-section.dto';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { ReorderDto } from './dto/reorder.dto';
import { UpdateFormItemDto } from './dto/update-form-item.dto';
import { UpdateFormSectionDto } from './dto/update-form-section.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { FormTemplatesService } from './form-templates.service';

@Controller('tenants/:tenantId')
export class FormTemplatesController {
  constructor(private readonly formTemplates: FormTemplatesService) {}

  @Get('form-templates')
  listCatalog(@Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    return this.formTemplates.listCatalog(tenantId);
  }

  @Post('work-types/:workTypeId/form-template')
  createTemplate(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('workTypeId', new ParseUUIDPipe()) workTypeId: string,
    @Body() dto: CreateFormTemplateDto
  ) {
    return this.formTemplates.createTemplate(tenantId, workTypeId, dto);
  }

  @Patch('form-templates/:templateId')
  updateTemplate(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() dto: UpdateFormTemplateDto
  ) {
    return this.formTemplates.updateTemplate(tenantId, templateId, dto);
  }

  @Post('form-templates/:templateId/sections')
  createSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() dto: CreateFormSectionDto
  ) {
    return this.formTemplates.createSection(tenantId, templateId, dto);
  }

  @Patch('form-sections/:sectionId')
  updateSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() dto: UpdateFormSectionDto
  ) {
    return this.formTemplates.updateSection(tenantId, sectionId, dto);
  }

  @Delete('form-sections/:sectionId')
  deleteSection(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string
  ) {
    return this.formTemplates.deleteSection(tenantId, sectionId);
  }

  @Put('form-templates/:templateId/section-order')
  reorderSections(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() dto: ReorderDto
  ) {
    return this.formTemplates.reorderSections(
      tenantId,
      templateId,
      dto.orderedIds
    );
  }

  @Post('form-sections/:sectionId/items')
  createItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() dto: CreateFormItemDto
  ) {
    return this.formTemplates.createItem(tenantId, sectionId, dto);
  }

  @Patch('form-items/:itemId')
  updateItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateFormItemDto
  ) {
    return this.formTemplates.updateItem(tenantId, itemId, dto);
  }

  @Delete('form-items/:itemId')
  deleteItem(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string
  ) {
    return this.formTemplates.deleteItem(tenantId, itemId);
  }

  @Put('form-sections/:sectionId/item-order')
  reorderItems(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('sectionId', new ParseUUIDPipe()) sectionId: string,
    @Body() dto: ReorderDto
  ) {
    return this.formTemplates.reorderItems(tenantId, sectionId, dto.orderedIds);
  }
}
