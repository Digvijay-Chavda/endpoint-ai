import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { accessibleToOwner, getOwnerId, notFound } from '@/lib/owner';
import { parseEndpointInput } from '@/lib/endpoint-input';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

async function findAccessibleEndpoint(id: string) {
  const ownerId = await getOwnerId();
  return prisma.endpoint.findFirst({
    where: { id, project: accessibleToOwner(ownerId) },
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!(await findAccessibleEndpoint(id))) return notFound('Endpoint');

    const body = await request.json().catch(() => null);
    const parsed = parseEndpointInput(body, true);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const endpoint = await prisma.endpoint.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(endpoint);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An endpoint with this exact path and method already exists in this project.' }, { status: 409 });
    }
    console.error('Failed to update endpoint', error);
    return NextResponse.json({ error: 'Failed to update endpoint' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!(await findAccessibleEndpoint(id))) return notFound('Endpoint');

    await prisma.endpoint.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return notFound('Endpoint');
    }
    console.error('Failed to delete endpoint', error);
    return NextResponse.json({ error: 'Failed to delete endpoint' }, { status: 500 });
  }
}
