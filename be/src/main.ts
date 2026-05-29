import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { RequestLogsService } from './modules/observability/services/request-logs.service';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditLogsService } from './modules/observability/services/audit-logs.service';
import { createValidationExceptionBody } from './common/utils/validation-errors.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN === '*'
        ? true
        : (process.env.CORS_ORIGIN?.split(',') ?? true),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) =>
        new BadRequestException(createValidationExceptionBody(errors)),
    }),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(app.get(Logger), app.get(RequestLogsService)),
    new AuditInterceptor(
      app.get(AuditLogsService),
      app.get(Reflector),
      app.get(Logger),
    ),
    new TimeoutInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseInterceptor(),
  );

  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kata Edu API')
    .setDescription('Tài liệu API cho Kata Edu')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
