import { Module } from '@nestjs/common';
import { UserApiController } from './user-api.controller';
import { UserApiClient } from './user-api.client';

@Module({
  controllers: [UserApiController],
  providers: [UserApiClient],
  exports: [UserApiClient],
})
export class UserApiModule {}
