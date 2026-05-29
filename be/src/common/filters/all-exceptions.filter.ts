import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { QueryFailedError } from 'typeorm';
import {
  ErrorResponseBody,
  FieldErrors,
  NormalizedError,
} from '../types/error-response.type';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const normalized = this.normalizeException(exception);

    if (normalized.statusCode >= 500) {
      this.logger.error({
        msg: 'unhandled exception',
        requestId: request.requestId,
        path: request.originalUrl,
        err: exception,
      });
    }

    const body: ErrorResponseBody = {
      success: false,
      statusCode: normalized.statusCode,
      errorCode: normalized.errorCode,
      message: normalized.message,
      details: normalized.details,
      fieldErrors: normalized.fieldErrors,
      path: request.originalUrl,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    };

    response.status(normalized.statusCode).json(body);
  }

  private normalizeException(exception: unknown): NormalizedError {
    if (exception instanceof QueryFailedError) {
      return {
        statusCode: HttpStatus.CONFLICT,
        errorCode: 'DATABASE_CONSTRAINT_ERROR',
        message: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc',
        details: undefined,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const body =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : (exceptionResponse as Record<string, unknown>);
      const message = this.normalizeMessage(body.message, exception.message);
      const details =
        Array.isArray(body.message) && body.details === undefined
          ? body.message
          : body.details;

      return {
        statusCode,
        errorCode:
          (body.errorCode as string) ??
          (body.error as string)?.toUpperCase().replaceAll(' ', '_') ??
          HttpStatus[statusCode] ??
          'HTTP_ERROR',
        message,
        details,
        fieldErrors: this.isFieldErrors(body.fieldErrors)
          ? body.fieldErrors
          : undefined,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi hệ thống',
      details: undefined,
    };
  }

  private normalizeMessage(message: unknown, fallback: string) {
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return 'Dữ liệu không hợp lệ';
    return fallback;
  }

  private isFieldErrors(value: unknown): value is FieldErrors {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    return Object.values(value).every(
      (messages) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === 'string'),
    );
  }
}
