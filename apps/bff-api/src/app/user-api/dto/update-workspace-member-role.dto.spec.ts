import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateWorkspaceMemberRoleDto } from './update-workspace-member-role.dto';

describe('UpdateWorkspaceMemberRoleDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const validate = (body: unknown) => pipe.transform(body, {
    type: 'body', metatype: UpdateWorkspaceMemberRoleDto,
  });

  it.each(['owner', 'admin', 'member', 'viewer'])('accepts %s', async role => {
    await expect(validate({ role })).resolves.toEqual({ role });
  });

  it.each([{}, { role: null }, { role: 'technician' }, { role: 'admin', userId: 'other-user' }])(
    'rejects invalid input %j', async body => {
      await expect(validate(body)).rejects.toBeInstanceOf(BadRequestException);
    }
  );
});
