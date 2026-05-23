import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [User, Workspace, WorkspaceMember],
    }),
    UsersModule,
    WorkspacesModule,
    WorkspaceMembersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
