import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { accessibleToOwner, findAccessibleProject, getOwnerId, notFound, publicProject, unauthorized } from '@/lib/owner';

export const dynamic = 'force-dynamic';

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const project = await findAccessibleProject(id, ownerId);
    if (!project) return notFound();
    return NextResponse.json(publicProject(project));
  } catch (error) {
    console.error('Failed to fetch project', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const project = await findAccessibleProject(id, ownerId);
    if (!project) return notFound();

    const body = await request.json().catch(() => null);
    const data: { name?: string; description?: string | null } = {};

    if (body?.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
      if (name.length > NAME_MAX) {
        return NextResponse.json({ error: `Project name must be ${NAME_MAX} characters or fewer` }, { status: 400 });
      }
      const duplicate = await prisma.project.findFirst({
        where: { ...accessibleToOwner(ownerId), id: { not: id }, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json({ error: `A project named "${name}" already exists. Choose a different name.` }, { status: 409 });
      }
      data.name = name;
    }
    if (body?.description !== undefined) {
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      if (description.length > DESCRIPTION_MAX) {
        return NextResponse.json({ error: `Description must be ${DESCRIPTION_MAX} characters or fewer` }, { status: 400 });
      }
      data.description = description || null;
    }

    const updated = await prisma.project.update({ where: { id }, data });
    return NextResponse.json(publicProject(updated));
  } catch (error) {
    console.error('Failed to update project', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const project = await findAccessibleProject(id, ownerId);
    if (!project) return notFound();

    await prisma.project.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // P2025: already deleted by a concurrent request
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return notFound();
    }
    console.error('Failed to delete project', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
