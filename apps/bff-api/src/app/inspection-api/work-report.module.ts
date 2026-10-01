import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesApiModule } from '../files-api/files-api.module';
import { InspectionApiModule } from './inspection-api.module';
import { WorkReportBuilder } from './work-report';
import { WorkReportPdf } from './work-report-pdf';
import { WorkReportController } from './work-report.controller';
import { ReportSettingsController } from './report-settings.controller';

@Module({
  imports: [AuthModule, InspectionApiModule, FilesApiModule],
  controllers: [WorkReportController, ReportSettingsController],
  providers: [WorkReportBuilder, WorkReportPdf],
})
export class WorkReportModule {}
