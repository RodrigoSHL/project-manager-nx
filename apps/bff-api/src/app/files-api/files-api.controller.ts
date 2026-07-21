import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { FilesApiService, IncomingImage } from './files-api.service';

@UseGuards(JwtAuthGuard)
@Controller('api/storage/files')
export class FilesApiController {
  constructor(private readonly files: FilesApiService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: Number(process.env.FILES_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024) } }))
  upload(@UploadedFile() file: IncomingImage | undefined, @Body() body: Record<string, string>, @Request() req: ExpressRequestWithUser) {
    return this.files.upload(file, body, req.user);
  }

  @Get()
  list(@Query() query: Record<string, string>, @Request() req: ExpressRequestWithUser) { return this.files.list(query, req.user); }

  @Get(':id/content')
  async content(@Param('id') id: string, @Request() req: ExpressRequestWithUser, @Res() res: Response) {
    const upstream = await this.files.content(id, req.user);
    for (const header of ['content-type', 'content-length', 'content-disposition']) {
      const value = upstream.headers.get(header); if (value) res.setHeader(header, value);
    }
    res.send(Buffer.from(await upstream.arrayBuffer()));
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: ExpressRequestWithUser) { return this.files.get(id, req.user); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: ExpressRequestWithUser) { return this.files.remove(id, req.user); }
}
