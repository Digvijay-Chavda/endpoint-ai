import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HttpMethod } from '@/types';
import { faker } from '@faker-js/faker';
import { publish, InspectorLogEntry } from '@/lib/inspector-bus';
import { randomUUID } from 'crypto';

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

  // Helper to publish a log entry once we have a status code
  const log = (statusCode: number, responseBody: string | null, endpointId: string | null) => {
    const entry: InspectorLogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      method,
      path,
      statusCode,
      latencyMs: Date.now() - startTime,
      requestHeaders,
      queryParams,
      requestBody: requestBodyText,
      responseBody,
      endpointId,
    };
    publish(projectId, entry);
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
      log(404, null, null);
      return NextResponse.json(
        { error: 'Mock endpoint not found or inactive in this project.' },
        { status: 404 }
      );
    }

    const headers = corsHeaders(endpoint.enableCors);

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
        const body = JSON.stringify({ error: 'Unauthorized. Authentication gated by RESTless simulation.' });
        log(401, body, endpoint.id);
        return NextResponse.json(
          { error: 'Unauthorized. Authentication gated by RESTless simulation.' },
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
        const randomErrorStatus = errorCodes[Math.floor(Math.random() * errorCodes.length)];
        const body = JSON.stringify({ error: `Simulated network error (Rate: ${endpoint.errorRate * 100}%)` });
        log(randomErrorStatus, body, endpoint.id);
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

    if (isJson) {
      log(200, JSON.stringify(responseBody), endpoint.id);
      return NextResponse.json(responseBody, { status: 200, headers });
    } else {
      log(200, String(responseBody), endpoint.id);
      return new NextResponse(responseBody, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    console.error(`Mockflow Error on [${method}] /mock/${projectId}${path}:`, error);
    log(500, null, null);
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
  
  // Try to find the endpoint to dynamically enable/disable CORS preflight
  try {
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        projectId: resolvedParams.projectId,
        path: path,
        active: true,
      },
    });
    
    // If we found it, and cors is disabled, throw a small error or omit headers.
    if (endpoint && !endpoint.enableCors) {
      return new NextResponse(null, { status: 204 }); 
    }
  } catch(e) {}
  
  // Default: Allow
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
