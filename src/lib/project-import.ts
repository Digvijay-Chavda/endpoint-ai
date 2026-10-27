import { EndpointFields, METHODS, normalizePath, parseEndpointInput } from '@/lib/endpoint-input';
import { HttpMethod } from '@/types';

export const EXPORT_FORMAT = 'endpoint-ai/project';
export const MAX_IMPORT_ENDPOINTS = 500;

export interface ParsedProject {
  name: string;
  description: string | null;
  endpoints: EndpointFields[];
  source: 'endpoint-ai' | 'openapi' | 'postman';
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);

const DEFAULTS = {
  latencyMs: 0,
  errorRate: 0,
  active: true,
  requireAuth: false,
  customAuthHeader: null,
  enableCors: true,
  statusCode: 200,
  responseHeaders: null,
  errorStatusCode: null,
} satisfies Omit<EndpointFields, 'path' | 'method' | 'responseBody'>;

function pretty(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function build(path: string, method: string, body: unknown, statusCode?: number): EndpointFields | null {
  const m = method.toUpperCase();
  if (!METHODS.includes(m as HttpMethod)) return null;
  const parsed = parseEndpointInput(
    {
      ...DEFAULTS,
      path: normalizePath(path || '/'),
      method: m,
      responseBody: body === undefined ? '{}' : pretty(body),
      ...(statusCode && statusCode >= 200 && statusCode <= 599 ? { statusCode } : {}),
    },
    false
  );
  return 'data' in parsed ? (parsed.data as EndpointFields) : null;
}

function dedupe(list: (EndpointFields | null)[]): EndpointFields[] {
  const seen = new Set<string>();
  const out: EndpointFields[] = [];
  for (const ep of list) {
    if (!ep) continue;
    const key = `${ep.method} ${ep.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ep);
  }
  return out;
}

// ── Native export format ────────────────────────────────────────────────────

function parseNative(json: Json): ParsedProject {
  const project = isObj(json.project) ? json.project : {};
  const list = Array.isArray(json.endpoints) ? json.endpoints : [];
  const endpoints = list.map(raw => {
    const parsed = parseEndpointInput({ ...DEFAULTS, ...(isObj(raw) ? raw : {}) }, false);
    return 'data' in parsed ? (parsed.data as EndpointFields) : null;
  });
  return {
    name: typeof project.name === 'string' && project.name.trim() ? project.name.trim() : 'Imported project',
    description: typeof project.description === 'string' ? project.description : null,
    endpoints: dedupe(endpoints),
    source: 'endpoint-ai',
  };
}

// ── OpenAPI 3.x / Swagger 2 ─────────────────────────────────────────────────

function resolveRef(root: Json, ref: unknown): unknown {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined;
  let cur: unknown = root;
  for (const part of ref.slice(2).split('/')) {
    if (!isObj(cur)) return undefined;
    cur = cur[part.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return cur;
}

function sampleFromSchema(root: Json, schema: unknown, depth = 0): unknown {
  if (!isObj(schema) || depth > 6) return null;
  if ('$ref' in schema) return sampleFromSchema(root, resolveRef(root, schema.$ref), depth + 1);
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
    const parts = schema[key];
    if (Array.isArray(parts) && parts.length) {
      if (key === 'allOf') {
        return Object.assign({}, ...parts.map(p => {
          const s = sampleFromSchema(root, p, depth + 1);
          return isObj(s) ? s : {};
        }));
      }
      return sampleFromSchema(root, parts[0], depth + 1);
    }
  }
  const type = schema.type ?? (isObj(schema.properties) ? 'object' : undefined);
  switch (type) {
    case 'object': {
      const out: Json = {};
      const props = isObj(schema.properties) ? schema.properties : {};
      for (const [k, v] of Object.entries(props)) out[k] = sampleFromSchema(root, v, depth + 1);
      return out;
    }
    case 'array':
      return [sampleFromSchema(root, schema.items, depth + 1)];
    case 'integer':
      return 1;
    case 'number':
      return 1.5;
    case 'boolean':
      return true;
    case 'string':
      switch (schema.format) {
        case 'date-time': return '2024-01-01T00:00:00Z';
        case 'date': return '2024-01-01';
        case 'uuid': return '123e4567-e89b-12d3-a456-426614174000';
        case 'email': return 'user@example.com';
        case 'uri': return 'https://example.com';
        default: return 'string';
      }
    default:
      return null;
  }
}

function parseOpenApi(json: Json): ParsedProject {
  const info = isObj(json.info) ? json.info : {};
  const paths = isObj(json.paths) ? json.paths : {};
  const list: (EndpointFields | null)[] = [];

  for (const [path, item] of Object.entries(paths)) {
    if (!isObj(item)) continue;
    for (const method of Object.keys(item)) {
      const op = item[method];
      if (!isObj(op) || !METHODS.includes(method.toUpperCase() as HttpMethod)) continue;

      const responses = isObj(op.responses) ? op.responses : {};
      const codes = Object.keys(responses);
      const code = codes.find(c => c === '200') ?? codes.find(c => /^2\d\d$/.test(c)) ?? codes.find(c => c === 'default');
      const resp = code ? responses[code] : undefined;
      const resolved = isObj(resp) && '$ref' in resp ? resolveRef(json, resp.$ref) : resp;

      let body: unknown = {};
      if (isObj(resolved)) {
        const content = isObj(resolved.content) ? resolved.content : {};
        const media = content['application/json'] ?? Object.values(content)[0];
        if (isObj(media)) {
          if (media.example !== undefined) body = media.example;
          else if (isObj(media.examples) && Object.values(media.examples)[0]) {
            const first = Object.values(media.examples)[0];
            body = isObj(first) && 'value' in first ? first.value : first;
          } else body = sampleFromSchema(json, media.schema);
        } else if (resolved.schema) {
          body = sampleFromSchema(json, resolved.schema); // Swagger 2
        }
      }
      list.push(build(path, method, body, code && /^\d+$/.test(code) ? Number(code) : undefined));
    }
  }

  return {
    name: typeof info.title === 'string' && info.title.trim() ? info.title.trim() : 'Imported API',
    description: typeof info.description === 'string' ? info.description.slice(0, 500) : null,
    endpoints: dedupe(list),
    source: 'openapi',
  };
}

// ── Postman collection v2.x ─────────────────────────────────────────────────

function postmanPath(url: unknown): string {
  let path = '';
  if (typeof url === 'string') path = url;
  else if (isObj(url)) {
    if (Array.isArray(url.path)) path = '/' + url.path.map(p => (isObj(p) ? String(p.value ?? '') : String(p))).join('/');
    else if (typeof url.raw === 'string') path = url.raw;
  }
  path = path.replace(/^\{\{[^}]+\}\}/, '').replace(/^[a-z]+:\/\/[^/]+/i, '').split('?')[0];
  return path || '/';
}

function collectPostman(items: unknown, out: (EndpointFields | null)[]) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (!isObj(item)) continue;
    if (Array.isArray(item.item)) {
      collectPostman(item.item, out);
      continue;
    }
    const req = item.request;
    if (!isObj(req) || typeof req.method !== 'string') continue;
    const responses = Array.isArray(item.response) ? item.response : [];
    const saved = responses.find(r => isObj(r) && typeof r.body === 'string' && r.body.trim()) as Json | undefined;
    let body: unknown = {};
    if (saved) {
      try {
        body = JSON.parse(saved.body as string);
      } catch {
        body = saved.body;
      }
    }
    out.push(build(postmanPath(req.url), req.method, body, typeof saved?.code === 'number' ? saved.code : undefined));
  }
}

function parsePostman(json: Json): ParsedProject {
  const info = isObj(json.info) ? json.info : {};
  const list: (EndpointFields | null)[] = [];
  collectPostman(json.item, list);
  const description = isObj(info.description) ? info.description.content : info.description;
  return {
    name: typeof info.name === 'string' && info.name.trim() ? info.name.trim() : 'Imported collection',
    description: typeof description === 'string' ? description.slice(0, 500) : null,
    endpoints: dedupe(list),
    source: 'postman',
  };
}

export function parseProjectImport(input: unknown): ParsedProject | { error: string } {
  let json = input;
  if (typeof json === 'string') {
    try {
      json = JSON.parse(json);
    } catch {
      return { error: 'That is not valid JSON.' };
    }
  }
  if (!isObj(json)) return { error: 'Expected a JSON object.' };

  let parsed: ParsedProject;
  if (json.format === EXPORT_FORMAT) parsed = parseNative(json);
  else if (typeof json.openapi === 'string' || typeof json.swagger === 'string') parsed = parseOpenApi(json);
  else if (Array.isArray(json.item) && isObj(json.info)) parsed = parsePostman(json);
  else return { error: 'Unrecognised format. Import an Endpoint export, an OpenAPI/Swagger JSON file, or a Postman collection.' };

  if (parsed.endpoints.length === 0) return { error: 'No importable endpoints were found in that file.' };
  if (parsed.endpoints.length > MAX_IMPORT_ENDPOINTS) {
    return { error: `Too many endpoints (${parsed.endpoints.length}). The limit is ${MAX_IMPORT_ENDPOINTS}.` };
  }
  parsed.name = parsed.name.slice(0, 100);
  return parsed;
}
