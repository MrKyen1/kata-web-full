import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { QueryFailedError } from 'typeorm';
import { RequestLogsService } from 'src/modules/observability/services/request-logs.service';
import { RequestUser } from '../types/request-user.type';
import { sanitizeLogPayload } from '../utils/sanitize-log-payload.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: Logger,
    private readonly requestLogsService: RequestLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<
      Request & { requestId?: string; user?: RequestUser }
    >();
    const response = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          msg: 'request completed',
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - start,
        });
        void this.persistRequestLog(request, response, start);
      }),
      catchError((error: unknown) => {
        const normalizedError = this.normalizeError(error);
        this.logger.error({
          msg: 'request failed',
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: normalizedError.statusCode,
          durationMs: Date.now() - start,
          err: error,
        });
        void this.persistRequestLog(request, response, start, normalizedError);
        return throwError(() => error);
      }),
    );
  }

  private async persistRequestLog(
    request: Request & { requestId?: string; user?: RequestUser },
    response: Response,
    start: number,
    error?: { statusCode: number; errorCode?: string; message?: string },
  ) {
    try {
      await this.requestLogsService.create({
        requestId: request.requestId ?? 'unknown',
        userId: request.user?.id,
        method: request.method,
        path: request.originalUrl,
        statusCode: error?.statusCode ?? response.statusCode,
        durationMs: Date.now() - start,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        requestBody: sanitizeLogPayload(
          (request.body ?? {}) as Record<string, unknown>,
        ),
        query: sanitizeLogPayload(
          (request.query ?? {}) as Record<string, unknown>,
        ),
        params: sanitizeLogPayload(
          (request.params ?? {}) as Record<string, unknown>,
        ),
        errorCode: error?.errorCode,
        errorMessage: error?.message,
      });
    } catch (logError: unknown) {
      this.logger.error({
        msg: 'failed to persist request log',
        requestId: request.requestId,
        err: logError,
      });
    }
  }

  private normalizeError(error: unknown) {
    if (error instanceof QueryFailedError) {
      return {
        statusCode: HttpStatus.CONFLICT,
        errorCode: 'DATABASE_CONSTRAINT_ERROR',
        message: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc',
      };
    }

    if (error instanceof HttpException) {
      const response = error.getResponse();
      const body =
        typeof response === 'string'
          ? { message: response }
          : (response as Record<string, unknown>);

      return {
        statusCode: error.getStatus(),
        errorCode: body.errorCode as string | undefined,
        message: this.normalizeMessage(body.message, error.message),
      };
    }

    return {
      statusCode: 500,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi hệ thống',
    };
  }

  private normalizeMessage(message: unknown, fallback: string) {
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return 'Dữ liệu không hợp lệ';
    return fallback;
  }
}
