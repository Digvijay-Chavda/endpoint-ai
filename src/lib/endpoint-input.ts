import { HttpMethod } from '@/types';

export const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// Headers the runtime must control itself.
const BLOCKED_HEADERS = new Set(['content-length', 'transfer-encoding', 'connection', 'set-cookie']);

export interface EndpointFields {
  path: string;
  method: HttpMethod;
  responseBody: string;
  latencyMs: number;
  errorRate: number;
  active: boolean;
  requireAuth: boolean;
  customAuthHeader: string | null;
  enableCors: boolean;
  statusCode: number;
  responseHeaders: string | null;
  errorStatusCode: number | null;
}

type Result = { data: Partial<EndpointFields> } | { error: string };

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

export function normalizePath(path: string) {
  const trimmed = path.trim();
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** Accepts an object or a JSON string; returns the stored JSON string, null for "none", or an error. */
function parseHeaders(value: unknown): { value: string | null } | { error: string } {
  if (value === null || value === undefined || value === '') return { value: null };
  let obj: unknown = value;
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value);
    } catch {
      return { error: 'Response headers must be valid JSON, e.g. {"X-Total-Count": "42"}.' };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { error: 'Response headers must be a JSON object, e.g. {"X-Total-Count": "42"}.' };
  }
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(k)) return { error: `Invalid header name "${k}".` };
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') {
      return { error: `Header "${k}" must be a string value.` };
    }
    if (BLOCKED_HEADERS.has(k.toLowerCase())) continue;
    clean[k] = String(v);
  }
  return { value: Object.keys(clean).length ? JSON.stringify(clean) : null };
}

/**
 * Whitelists and validates endpoint fields. With `partial`, only supplied fields are returned
 * (PATCH); otherwise path, method and responseBody are required (POST / import).
 */
export function parseEndpointInput(body: unknown, partial: boolean): Result {
  if (!body || typeof body !== 'object') return { error: 'Request body must be a JSON object.' };
  const b = body as Record<string, unknown>;
  const data: Partial<EndpointFields> = {};

  if (b.path !== undefined || !partial) {
    if (typeof b.path !== 'string' || !b.path.trim()) return { error: 'Path is required.' };
    if (b.path.length > 300) return { error: 'Path is too long.' };
    data.path = normalizePath(b.path);
  }
  if (b.method !== undefined || !partial) {
    if (typeof b.method !== 'string' || !METHODS.includes(b.method as HttpMethod)) {
      return { error: `Method must be one of ${METHODS.join(', ')}.` };
    }
    data.method = b.method as HttpMethod;
  }
  if (b.responseBody !== undefined || !partial) {
    if (typeof b.responseBody !== 'string') return { error: 'Response body must be a string.' };
    data.responseBody = b.responseBody;
  }
  if (b.latencyMs !== undefined) {
    if (!isInt(b.latencyMs, 0, 10000)) return { error: 'Latency must be a whole number between 0 and 10000 ms.' };
    data.latencyMs = b.latencyMs;
  }
  if (b.errorRate !== undefined) {
    if (typeof b.errorRate !== 'number' || !(b.errorRate >= 0 && b.errorRate <= 1)) {
      return { error: 'Error rate must be between 0 and 1.' };
    }
    data.errorRate = b.errorRate;
  }
  for (const key of ['active', 'requireAuth', 'enableCors'] as const) {
    if (b[key] !== undefined) {
      if (typeof b[key] !== 'boolean') return { error: `${key} must be true or false.` };
      data[key] = b[key] as boolean;
    }
  }
  if (b.customAuthHeader !== undefined) {
    if (b.customAuthHeader !== null && typeof b.customAuthHeader !== 'string') {
      return { error: 'customAuthHeader must be a string.' };
    }
    data.customAuthHeader = b.customAuthHeader?.toString().trim() || null;
  }
  if (b.statusCode !== undefined) {
    if (!isInt(b.statusCode, 200, 599)) return { error: 'Status code must be a whole number between 200 and 599.' };
    data.statusCode = b.statusCode;
  }
  if (b.errorStatusCode !== undefined) {
    if (b.errorStatusCode !== null && !isInt(b.errorStatusCode, 400, 599)) {
      return { error: 'Error status code must be between 400 and 599.' };
    }
    data.errorStatusCode = b.errorStatusCode as number | null;
  }
  if (b.responseHeaders !== undefined) {
    const parsed = parseHeaders(b.responseHeaders);
    if ('error' in parsed) return { error: parsed.error };
    data.responseHeaders = parsed.value;
  }
  return { data };
}

export function parseStoredHeaders(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? (obj as Record<string, string>) : {};
  } catch {
    return {};
  }
}
