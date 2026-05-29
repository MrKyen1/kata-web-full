import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Logger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { RequestUser } from '../types/request-user.type';
import { sanitizeLogPayload } from '../utils/sanitize-log-payload.util';
import { AuditLogsService } from 'src/modules/observability/services/audit-logs.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly mutationMethods = new Set(['POST', 'PATCH', 'DELETE']);

  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly reflector: Reflector,
    private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<
      Request & { requestId?: string; user?: RequestUser }
    >();
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions && !this.mutationMethods.has(request.method)) {
      return next.handle();
    }

    const auditContext = auditOptions ?? this.inferAuditOptions(request);

    return next.handle().pipe(
      tap((responseBody) => {
        void this.persistAuditLog(request, auditContext, responseBody);
      }),
    );
  }

  private async persistAuditLog(
    request: Request & { requestId?: string; user?: RequestUser },
    auditOptions: AuditOptions,
    responseBody: unknown,
  ) {
    try {
      await this.auditLogsService.createFromRequest(request, {
        ...auditOptions,
        resourceId: this.extractResourceId(request, responseBody),
        payload: {
          params: request.params,
          query: request.query,
          body: sanitizeLogPayload(request.body ?? {}),
        },
      });
    } catch (error: unknown) {
      this.logger.error({
        msg: 'failed to persist audit log',
        requestId: request.requestId,
        err: error,
      });
    }
  }

  private inferAuditOptions(request: Request): AuditOptions {
    const resource = this.inferResource(request.originalUrl);
    return {
      action: `${resource}.${this.inferAction(request.method)}`,
      resource,
    };
  }

  private inferResource(originalUrl: string) {
    const path = originalUrl.split('?')[0] ?? '';
    const segments = path
      .split('/')
      .filter(Boolean)
      .filter((segment) => segment !== 'api' && segment !== 'v1');

    if (segments[0] === 'learning' && segments[1]) {
      return `learning.${segments[1]}`;
    }

    if (segments[0] === 'auth' && segments[1]) {
      return `auth.${segments[1]}`;
    }

    return segments[0] ?? 'unknown';
  }

  private inferAction(method: string) {
    if (method === 'POST') return 'create';
    if (method === 'PATCH') return 'update';
    if (method === 'DELETE') return 'inactive';
    return method.toLowerCase();
  }

  private extractResourceId(
    request: Request,
    responseBody: unknown,
  ): string | undefined {
    const paramId = request.params?.id;
    if (typeof paramId === 'string') return paramId;

    const maybeData = responseBody as
      | { id?: string; data?: { id?: string } }
      | undefined;

    return maybeData?.data?.id ?? maybeData?.id;
  }
}
