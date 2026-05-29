import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { RequestLogsController } from './controllers/request-logs.controller';
import { AuditLog } from './entities/audit-log.entity';
import { RequestLog } from './entities/request-log.entity';
import { AuditLogsService } from './services/audit-logs.service';
import { RequestLogsService } from './services/request-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, RequestLog])],
  controllers: [AuditLogsController, RequestLogsController],
  providers: [AuditLogsService, RequestLogsService],
  exports: [AuditLogsService, RequestLogsService],
})
export class ObservabilityModule {}
