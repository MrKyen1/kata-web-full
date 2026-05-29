import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { requestId?: string }>();

    return next.handle().pipe(
      map((response: unknown) => {
        const responseObject =
          response && typeof response === 'object'
            ? (response as Record<string, unknown>)
            : undefined;

        if (
          responseObject?.success === true ||
          responseObject?.success === false
        ) {
          return response;
        }

        const hasDataEnvelope = Boolean(
          responseObject &&
          Object.prototype.hasOwnProperty.call(responseObject, 'data'),
        );

        console.log('ResponseInterceptor - requestId:', request.requestId);

        return {
          success: true,
          data: hasDataEnvelope ? responseObject?.data : response,
          meta: hasDataEnvelope ? responseObject?.meta : undefined,
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
