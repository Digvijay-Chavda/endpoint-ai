import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { accessibleToOwner, getOwnerId, notFound, unauthorized } from '@/lib/owner';

export const dynamic = 'force-dynamic';

// POST /api/endpoints/[id]/duplicate → copies the endpoint to "<path>-copy" (then -copy-2, ...)
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const source = await prisma.endpoint.findFirst({
      where: { id, project: accessibleToOwner(ownerId) },
    });
    if (!source) return notFound('Endpoint');

    const siblings = await prisma.endpoint.findMany({
      where: { projectId: source.projectId, method: source.method },
      select: { path: true },
    });
    const taken = new Set(siblings.map(s => s.path));
    let path = `${source.path}-copy`;
    for (let i = 2; taken.has(path); i++) path = `${source.path}-copy-${i}`;

    const copy = await prisma.endpoint.create({
      data: {
        projectId: source.projectId,
        path,
        method: source.method,
        responseBody: source.responseBody,
        statusCode: source.statusCode,
        responseHeaders: source.responseHeaders,
        latencyMs: source.latencyMs,
        errorRate: source.errorRate,
        errorStatusCode: source.errorStatusCode,
        active: source.active,
        requireAuth: source.requireAuth,
        customAuthHeader: source.customAuthHeader,
        enableCors: source.enableCors,
      },
    });
    return NextResponse.json(copy, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Could not pick a unique path for the copy. Try again.' }, { status: 409 });
    }
    console.error('Failed to duplicate endpoint', error);
    return NextResponse.json({ error: 'Failed to duplicate endpoint' }, { status: 500 });
  }
}
