import { Module } from '@nestjs/common';
import { UserApiClient } from './user-api.client';

@Module({
  providers: [UserApiClient],
  exports: [UserApiClient],
})
export class UserApiModule {}
