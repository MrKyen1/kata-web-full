import {
  ArgumentsHost,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const createHost = () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = {
      originalUrl: '/api/v1/users',
      requestId: 'request-1',
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;

    return { host, response };
  };

  const createFilter = () =>
    new AllExceptionsFilter({ error: jest.fn() } as never);

  it.each([
    [
      new NotFoundException('Không tìm thấy người dùng'),
      404,
      'NOT_FOUND',
      'Không tìm thấy người dùng',
    ],
    [
      new ConflictException('Người dùng đã tồn tại'),
      409,
      'CONFLICT',
      'Người dùng đã tồn tại',
    ],
    [
      new UnauthorizedException('Access token không hợp lệ'),
      401,
      'UNAUTHORIZED',
      'Access token không hợp lệ',
    ],
  ])(
    'normalizes business exceptions',
    (exception, statusCode, errorCode, message) => {
      const { host, response } = createHost();

      createFilter().catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(statusCode);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode,
          errorCode,
          message,
          path: '/api/v1/users',
          requestId: 'request-1',
        }),
      );
    },
  );

  it('preserves field-level validation errors', () => {
    const { host, response } = createHost();

    createFilter().catch(
      new ConflictException({
        errorCode: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        fieldErrors: { email: ['email phải là email hợp lệ'] },
        details: ['email phải là email hợp lệ'],
      }),
      host,
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        fieldErrors: { email: ['email phải là email hợp lệ'] },
        details: ['email phải là email hợp lệ'],
      }),
    );
  });

  it('normalizes database constraint errors without leaking internals', () => {
    const { host, response } = createHost();
    const queryError = new QueryFailedError(
      'SELECT secret',
      [],
      new Error('raw db error'),
    );

    createFilter().catch(queryError, host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'DATABASE_CONSTRAINT_ERROR',
        message: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc',
        details: undefined,
      }),
    );
  });

  it('normalizes unknown errors without leaking internals', () => {
    const { host, response } = createHost();

    createFilter().catch(new Error('secret internal detail'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'Lỗi hệ thống',
        details: undefined,
      }),
    );
  });
});
