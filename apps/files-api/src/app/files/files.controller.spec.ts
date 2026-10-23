import { Response } from 'express';
import { StoredFile } from './entities/stored-file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

it('returns readable legacy names in listings, detail and download headers', async () => {
  const name = 'Screenshot 2026-10-22 at 11.55.42\u202fPM.png';
  const once = Buffer.from(name, 'utf8').toString('latin1');
  const originalName = Buffer.from(once, 'utf8').toString('latin1');
  const file = { id: 'file-1', originalName, mimeType: 'image/png', size: 3 } as StoredFile;
  const data = Buffer.from('png');
  const service = {
    findAll: jest.fn().mockResolvedValue([file]),
    findOne: jest.fn().mockResolvedValue(file),
    download: jest.fn().mockResolvedValue({ file, data }),
  };
  const controller = new FilesController(service as unknown as FilesService);
  expect(await controller.findAll({ application: 'jira-web' })).toEqual([expect.objectContaining({ originalName: name })]);
  expect(await controller.findOne('file-1')).toEqual(expect.objectContaining({ originalName: name }));
  const response = { type: jest.fn(), attachment: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
  await controller.download('file-1', response as unknown as Response);
  expect(response.attachment).toHaveBeenCalledWith(name);
  expect(response.send).toHaveBeenCalledWith(data);
  expect(file.originalName).toBe(originalName);
});
