import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().default('development'),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().default('dev-access-secret'),
  JWT_REFRESH_SECRET: Joi.string().default('dev-refresh-secret'),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_TTL_MS: Joi.number().default(604800000),
  CORS_ORIGIN: Joi.string().default('*'),
  LOG_LEVEL: Joi.string().default('info'),
  LOG_TO_FILE: Joi.boolean().default(false),
  LOG_DIR: Joi.string().default('logs'),
  LOG_FILE_MAX_SIZE: Joi.string().default('10m'),
  LOG_FILE_RETENTION_DAYS: Joi.number().default(30),
  LOG_FILE_DATE_FORMAT: Joi.string().default('yyyy-MM-dd'),
});
