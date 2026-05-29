import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { paginate } from 'src/common/utils/pagination.util';
import { RequestLogQueryDto } from '../dto/request-log-query.dto';
import { RequestLog } from '../entities/request-log.entity';

export interface CreateRequestLogInput {
  requestId: string;
  userId?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress?: string;
  userAgent?: string;
  requestBody: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class RequestLogsService {
  constructor(
    @InjectRepository(RequestLog)
    private readonly requestLogRepository: Repository<RequestLog>,
  ) {}

  async create(input: CreateRequestLogInput) {
    await this.requestLogRepository.save(
      this.requestLogRepository.create(input),
    );
  }

  async findAll(query: RequestLogQueryDto) {
    const qb = this.requestLogRepository
      .createQueryBuilder('requestLog')
      .orderBy('requestLog.created_at', 'DESC');

    if (query.userId) {
      qb.andWhere('requestLog.user_id = :userId', { userId: query.userId });
    }
    if (query.requestId) {
      qb.andWhere('requestLog.request_id = :requestId', {
        requestId: query.requestId,
      });
    }
    if (query.statusCode) {
      qb.andWhere('requestLog.status_code = :statusCode', {
        statusCode: query.statusCode,
      });
    }
    if (query.method) {
      qb.andWhere('requestLog.method = :method', {
        method: query.method.toUpperCase(),
      });
    }
    if (query.path) {
      qb.andWhere('requestLog.path ILIKE :path', { path: `%${query.path}%` });
    }
    if (query.from) {
      qb.andWhere('requestLog.created_at >= :from', {
        from: new Date(query.from),
      });
    }
    if (query.to) {
      qb.andWhere('requestLog.created_at <= :to', { to: new Date(query.to) });
    }

    return paginate(qb, query);
  }

  async findOne(id: string) {
    const log = await this.requestLogRepository.findOne({
      where: { id },
    });
    if (!log) throw new NotFoundException('Không tìm thấy nhật ký yêu cầu');
    return { data: log };
  }

  async cleanup(retentionDays = 30) {
    const before = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.requestLogRepository.delete({
      createdAt: LessThan(before),
    });
    return { data: { deleted: result.affected ?? 0, before } };
  }
}
