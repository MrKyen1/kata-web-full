'use strict';

const build = require('pino-abstract-transport');
const { once } = require('events');
const pinoRoll = require('pino-roll');

const LEVEL_LABELS = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
};

module.exports = async function prettyRollTransport(options) {
  const destination = await pinoRoll(options);

  return build(
    async function (source) {
      for await (const record of source) {
        const line = formatRecord(record);
        if (!destination.write(line)) {
          await once(destination, 'drain');
        }
      }
    },
    {
      close: async () => {
        await new Promise((resolve, reject) => {
          destination.flush((error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        destination.end();
      },
    },
  );
};

function formatRecord(record) {
  const timestamp = formatTimestamp(record.time);
  const level = LEVEL_LABELS[Number(record.level)] ?? String(record.level ?? 'INFO');
  const message = String(record.msg ?? record.message ?? 'log');
  const fields = formatFields(record);
  const error = formatError(record.err);
  const suffix = fields ? ` ${fields}` : '';

  return `${timestamp} ${level.padEnd(5)} ${message}${suffix}${error}\n`;
}

function formatTimestamp(value) {
  const date =
    typeof value === 'number' || typeof value === 'string'
      ? new Date(value)
      : new Date();

  if (Number.isNaN(date.getTime())) return new Date().toISOString();

  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.${ms}`;
}

function formatFields(record) {
  const skipKeys = new Set([
    'level',
    'time',
    'pid',
    'hostname',
    'msg',
    'message',
    'err',
    'req',
    'res',
    'responseTime',
  ]);

  return Object.entries(record)
    .filter(([key, value]) => !skipKeys.has(key) && value !== undefined)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(' ');
}

function formatValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return quoteIfNeeded(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return quoteIfNeeded(JSON.stringify(value));
}

function quoteIfNeeded(value) {
  return /\s/.test(value) ? JSON.stringify(value) : value;
}

function formatError(error) {
  if (!error || typeof error !== 'object') return '';

  const header = [error.type, error.code, error.message].filter(Boolean).join(' ');
  const stack = error.stack ? `\n${error.stack}` : '';

  return header || stack ? `\n  error: ${header}${stack}` : '';
}
