import { mkdirSync } from 'fs';
import { join } from 'path';
import type { TransportTargetOptions } from 'pino';
import type { Params } from 'nestjs-pino';

export function createLoggerConfig(): Params {
  const logLevel = process.env.LOG_LEVEL ?? 'info';
  const logToFile = process.env.LOG_TO_FILE === 'true';
  const logFileDateFormat = process.env.LOG_FILE_DATE_FORMAT ?? 'yyyy-MM-dd';
  const isProduction = process.env.NODE_ENV === 'production';

  const targets: TransportTargetOptions[] = [];

  if (isProduction) {
    targets.push({
      target: 'pino/file',
      level: logLevel,
      options: { destination: 1 },
    });
  } else {
    targets.push({
      target: 'pino-pretty',
      level: logLevel,
      options: {
        singleLine: true,
        colorize: true,
      },
    });
  }

  if (logToFile) {
    const logDir = process.env.LOG_DIR ?? 'logs';
    mkdirSync(logDir, { recursive: true });
    const prettyRollTransport = join(__dirname, 'pretty-roll.transport.cjs');
    const fileOptions = {
      size: process.env.LOG_FILE_MAX_SIZE ?? '10m',
      frequency: 'daily',
      dateFormat: logFileDateFormat,
      mkdir: true,
      limit: {
        count: Number(process.env.LOG_FILE_RETENTION_DAYS ?? 30),
        removeOtherLogFiles: false,
      },
    };

    targets.push({
      target: prettyRollTransport,
      level: logLevel,
      options: {
        ...fileOptions,
        file: join(logDir, 'app'),
      },
    });

    targets.push({
      target: prettyRollTransport,
      level: 'error',
      options: {
        ...fileOptions,
        file: join(logDir, 'error'),
      },
    });
  }

  return {
    pinoHttp: {
      level: logLevel,
      transport: {
        targets,
      },
    },
  };
}
