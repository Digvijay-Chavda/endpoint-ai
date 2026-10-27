/**
 * Shape of a request-inspector log entry. Entries are persisted in the RequestLog table
 * (see the mock route) so they survive reloads and work across serverless instances;
 * the inspector stream and history endpoints read them back from the database.
 */
export interface InspectorLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  requestHeaders: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody: string | null;
  responseBody: string | null;
  endpointId: string | null;
}
