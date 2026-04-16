import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateEndpointInput } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const endpoints = await prisma.endpoint.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(endpoints);
  } catch (error) {
    console.error('Failed to fetch endpoints', error);
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateEndpointInput = await request.json();
    
    if (!body.projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Ensure path starts with a slash
    const normalizedPath = body.path.startsWith('/') ? body.path : `/${body.path}`;

    const endpoint = await prisma.endpoint.create({
      data: {
        projectId: body.projectId,
        path: normalizedPath,
        method: body.method,
        responseBody: body.responseBody,
        latencyMs: body.latencyMs || 0,
        errorRate: body.errorRate || 0,
        active: body.active ?? true,
      },
    });

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create endpoint', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An endpoint with this exact path and method already exists in this project.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }
}
