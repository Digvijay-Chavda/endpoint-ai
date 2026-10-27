import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HttpMethod } from '@/types';
import { faker } from '@faker-js/faker';
import { parseStoredHeaders } from '@/lib/endpoint-input';

// A helper to parse {{faker.module.method()}} templates
function interpolateFakerTemplates(rawString: string): string {
  // Regex to match {{faker.module.method}} or {{faker.module.method()}}
  const fakerRegex = /\{\{faker\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)(?:\(\))?\}\}/g;
  
  return rawString.replace(fakerRegex, (match, moduleName, methodName) => {
    try {
      // safely access faker.module.method
      const fakerModule = (faker as any)[moduleName];
      if (fakerModule && typeof fakerModule[methodName] === 'function') {
        const result = fakerModule[methodName]();
        // Return stringified version to safely place within JSON if needed, 
        //, but replace() coerces to string anyway. If it's an object, it'll be [object Object], but Faker mostly returns primitives.
        return String(result);
      }
    } catch (e) {
      console.warn(`Failed to parse faker template: ${match}`, e);
    }
    return match; // Fallback to original string if failed
  });
}

function corsHeaders(enableCors: boolean): Record<string, string> {
  if (!enableCors) return {};
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Statuses that must not carry a body
const NO_BODY_STATUSES = new Set([204, 205, 304]);

const MAX_LOGGED_BODY = 10_000;
const MAX_LOGS_PER_PROJECT = 500;

// Never persist full credentials or cookies in the request log.
function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out = { ...headers };
  for (const key of Object.keys(out)) {
    const lower = key.toLowerCase();
    if (lower === 'cookie' || lower === 'set-cookie') out[key] = '[redacted]';
    else if (lower === 'authorization' && out[key].length > 10) out[key] = `${out[key].slice(0, 10)}…[redacted]`;
  }
  return out;
}

const clip = (text: string | null) =>
  text && text.length > MAX_LOGGED_BODY ? `${text.slice(0, MAX_LOGGED_BODY)}… [truncated]` : text;

async function handleRequest(request: Request, projectId: string, slug: string[], method: HttpMethod) {
  const path = '/' + slug.join('/');
  const startTime = Date.now();

  // Capture query params
  const url = new URL(request.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { queryParams[k] = v; });

  // Capture request headers
  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((v, k) => { requestHeaders[k] = v; });

  // Capture request body (only for non-GET methods)
  let requestBodyText: string | null = null;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    try {
      requestBodyText = await request.clone().text();
    } catch { /* ignore */ }
  }

  // Persist a log entry for the Request Inspector once we have a status code.
  // Awaited so serverless runtimes don't drop the write after the response is sent.
  const log = async (statusCode: number, responseBody: string | null, endpointId: string | null) => {
    try {
      await prisma.requestLog.create({
        data: {
          projectId,
          endpointId,
          method,
          path,
          statusCode,
          latencyMs: Date.now() - startTime,
          requestHeaders: JSON.stringify(redactHeaders(requestHeaders)),
          queryParams: JSON.stringify(queryParams),
          requestBody: clip(requestBodyText),
          responseBody: clip(responseBody),
        },
      });
      if (Math.random() < 0.05) {
        // Occasionally trim old rows so the table doesn't grow without bound
        const cutoff = await prisma.requestLog.findFirst({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
          skip: MAX_LOGS_PER_PROJECT,
          select: { createdAt: true },
        });
        if (cutoff) await prisma.requestLog.deleteMany({ where: { projectId, createdAt: { lte: cutoff.createdAt } } });
      }
    } catch (e) {
      // The project may have been deleted mid-request, or logging may be unavailable; never fail the mock response
      console.warn('Failed to store request log', e);
    }
  };

  try {
    // 1. Find the active endpoint configured by the user
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        projectId: projectId,
        path: path,
        method: method,
        active: true,
      },
    });

    if (!endpoint) {
      await log(404, null, null);
      return NextResponse.json(
        { error: 'Mock endpoint not found or inactive in this project.' },
        { status: 404 }
      );
    }

    const headers = { ...parseStoredHeaders(endpoint.responseHeaders), ...corsHeaders(endpoint.enableCors) };

    // 2. Authentication Gate Simulation
    if (endpoint.requireAuth) {
      const authHeader = request.headers.get('authorization');
      const expectedTokens = endpoint.customAuthHeader ? endpoint.customAuthHeader.split(',').map((s: string) => s.trim()) : [];
      let authenticated = false;
      
      if (expectedTokens.length > 0) {
         if (authHeader && expectedTokens.includes(authHeader)) {
           authenticated = true;
         }
      } else {
         if (authHeader && authHeader.length > 0) {
           authenticated = true;
         }
      }

      if (!authenticated) {
        const body = JSON.stringify({ error: 'Unauthorized. Authentication gated by Endpoint simulation.' });
        await log(401, body, endpoint.id);
        return NextResponse.json(
          { error: 'Unauthorized. Authentication gated by Endpoint simulation.' },
          { status: 401, headers }
        );
      }
    }

    // 3. Simulate latency
    if (endpoint.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, endpoint.latencyMs));
    }

    // 4. Simulate error rate
    if (endpoint.errorRate > 0) {
      const randomValue = Math.random();
      if (randomValue < endpoint.errorRate) {
        const errorCodes = [500, 502, 503, 504];
        const randomErrorStatus = endpoint.errorStatusCode ?? errorCodes[Math.floor(Math.random() * errorCodes.length)];
        const body = JSON.stringify({ error: `Simulated network error (Rate: ${endpoint.errorRate * 100}%)` });
        await log(randomErrorStatus, body, endpoint.id);
        return NextResponse.json(
          { error: `Simulated network error (Rate: ${endpoint.errorRate * 100}%)` },
          { status: randomErrorStatus, headers }
        );
      }
    }

    // 5. Build Dynamic Response with Faker Templates
    let processedBodyString = endpoint.responseBody;
    
    if (processedBodyString && processedBodyString.includes('{{faker.')) {
      processedBodyString = interpolateFakerTemplates(processedBodyString);
    }

    let responseBody;
    let isJson = false;
    try {
      if (processedBodyString) {
        responseBody = JSON.parse(processedBodyString);
        isJson = true;
      } else {
        responseBody = {};
        isJson = true;
      }
    } catch {
      responseBody = processedBodyString;
    }

    const status = endpoint.statusCode;

    if (NO_BODY_STATUSES.has(status)) {
      await log(status, null, endpoint.id);
      return new NextResponse(null, { status, headers });
    }

    if (isJson) {
      await log(status, JSON.stringify(responseBody), endpoint.id);
      return NextResponse.json(responseBody, { status, headers });
    } else {
      await log(status, String(responseBody), endpoint.id);
      return new NextResponse(responseBody, {
        status,
        headers: { 'Content-Type': 'text/plain', ...headers },
      });
    }
  } catch (error) {
    console.error(`Mockflow Error on [${method}] /mock/${projectId}${path}:`, error);
    await log(500, null, null);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

type ParamsProps = { params: Promise<{ projectId: string, slug: string[] }> };

export async function GET(req: Request, { params }: ParamsProps) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams.projectId, resolvedParams.slug, 'GET');
}

export async function POST(req: Request, { params }: ParamsProps) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams.projectId, resolvedParams.slug, 'POST');
}

export async function PUT(req: Request, { params }: ParamsProps) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams.projectId, resolvedParams.slug, 'PUT');
}

export async function PATCH(req: Request, { params }: ParamsProps) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams.projectId, resolvedParams.slug, 'PATCH');
}

export async function DELETE(req: Request, { params }: ParamsProps) {
  const resolvedParams = await params;
  return handleRequest(req, resolvedParams.projectId, resolvedParams.slug, 'DELETE');
}

export async function OPTIONS(req: Request, { params }: ParamsProps) {
  const resolvedParams = await params;
  const path = '/' + resolvedParams.slug.join('/');
  const requestedMethod = req.headers.get('access-control-request-method');
  // Echo the headers the browser says it will send, so custom headers pass the preflight
  const requestedHeaders = req.headers.get('access-control-request-headers');

  // Try to find the endpoint to dynamically enable/disable CORS preflight
  try {
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        projectId: resolvedParams.projectId,
        path: path,
        active: true,
        ...(requestedMethod ? { method: requestedMethod.toUpperCase() } : {}),
      },
    });
    
    // If we found it, and cors is disabled, answer the preflight without CORS headers
    if (endpoint && !endpoint.enableCors) {
      return new NextResponse(null, { status: 204 }); 
    }
  } catch (e) {
    console.warn('Preflight endpoint lookup failed', e);
  }
  
  // Default: Allow
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': requestedHeaders || 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
