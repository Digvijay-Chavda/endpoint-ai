import { RequestLog } from '@prisma/client';
import { InspectorLogEntry } from '@/lib/inspector-bus';

function parseObject(raw: string): Record<string, string> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export function toLogEntry(row: RequestLog): InspectorLogEntry {
  return {
    id: row.id,
    timestamp: row.createdAt.toISOString(),
    method: row.method,
    path: row.path,
    statusCode: row.statusCode,
    latencyMs: row.latencyMs,
    requestHeaders: parseObject(row.requestHeaders),
    queryParams: parseObject(row.queryParams),
    requestBody: row.requestBody,
    responseBody: row.responseBody,
    endpointId: row.endpointId,
  };
}
