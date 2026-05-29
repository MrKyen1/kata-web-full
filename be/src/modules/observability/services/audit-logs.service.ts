import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { sanitizeLogPayload } from 'src/common/utils/sanitize-log-payload.util';
import { paginate } from 'src/common/utils/pagination.util';
import { RequestUser } from 'src/common/types/request-user.type';
import { AuditLog } from 'src/modules/observability/entities/audit-log.entity';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

export interface CreateAuditLogInput {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  requestId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(input: CreateAuditLogInput) {
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        ...input,
        payload: sanitizeLogPayload(input.payload ?? {}),
      }),
    );
  }

  async createFromRequest(
    request: Request & { requestId?: string; user?: RequestUser },
    input: Pick<CreateAuditLogInput, 'action' | 'resource' | 'resourceId'> & {
      payload?: Record<string, unknown>;
    },
  ) {
    await this.create({
      actorId: request.user?.id,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      requestId: request.requestId,
      payload: input.payload,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  async findAll(query: AuditLogQueryDto) {
    const qb = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .orderBy('auditLog.created_at', 'DESC');

    if (query.actorId) {
      qb.andWhere('auditLog.actor_id = :actorId', { actorId: query.actorId });
    }
    if (query.action) {
      qb.andWhere('auditLog.action = :action', { action: query.action });
    }
    if (query.resource) {
      qb.andWhere('auditLog.resource = :resource', {
        resource: query.resource,
      });
    }
    if (query.resourceId) {
      qb.andWhere('auditLog.resource_id = :resourceId', {
        resourceId: query.resourceId,
      });
    }
    if (query.requestId) {
      qb.andWhere('auditLog.request_id = :requestId', {
        requestId: query.requestId,
      });
    }
    if (query.from) {
      qb.andWhere('auditLog.created_at >= :from', {
        from: new Date(query.from),
      });
    }
    if (query.to) {
      qb.andWhere('auditLog.created_at <= :to', { to: new Date(query.to) });
    }

    return paginate(qb, query);
  }

  async findOne(id: string) {
    const log = await this.auditLogRepository.findOne({
      where: { id },
    });
    if (!log) throw new NotFoundException('Không tìm thấy nhật ký kiểm toán');
    return { data: log };
  }
}
