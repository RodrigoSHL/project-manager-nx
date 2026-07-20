import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: getDatabaseConfig }),
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
