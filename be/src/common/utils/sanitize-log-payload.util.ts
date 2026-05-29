const SENSITIVE_KEYS = new Set([
  'password',
  'hashedPassword',
  'currentPassword',
  'oldPassword',
  'newPassword',
  'confirmPassword',
  'accessToken',
  'refreshToken',
  'token',
  'tokenHash',
  'authorization',
]);

const REDACTED = '[REDACTED]';

export function sanitizeLogPayload<T>(payload: T): T {
  return sanitizeValue(payload) as T;
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const result: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    result[key] = SENSITIVE_KEYS.has(key)
      ? REDACTED
      : sanitizeValue(nestedValue);
  }

  return result;
}
