import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { findAccessibleProject, notFound } from '@/lib/owner';
import { parseEndpointInput } from '@/lib/endpoint-input';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    if (!(await findAccessibleProject(projectId))) return notFound();

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
    const body = await request.json().catch(() => null);

    if (!body?.projectId || typeof body.projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    if (!(await findAccessibleProject(body.projectId))) return notFound();

    const parsed = parseEndpointInput(body, false);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const endpoint = await prisma.endpoint.create({
      data: {
        ...(parsed.data as Required<typeof parsed.data>),
        projectId: body.projectId,
      },
    });

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error('Failed to create endpoint', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An endpoint with this exact path and method already exists in this project.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }
}
