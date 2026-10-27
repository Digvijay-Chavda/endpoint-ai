import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accessibleToOwner, getOwnerId, publicProject, unauthorized } from '@/lib/owner';
import { ensureUserRow } from '@/lib/users';

export const dynamic = 'force-dynamic';

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

export async function GET() {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const projects = await prisma.project.findMany({
      where: accessibleToOwner(ownerId),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { endpoints: true } } },
    });
    return NextResponse.json(projects.map(publicProject));
  } catch (error) {
    console.error('Failed to fetch projects', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    if (name.length > NAME_MAX) {
      return NextResponse.json({ error: `Project name must be ${NAME_MAX} characters or fewer` }, { status: 400 });
    }
    if (description.length > DESCRIPTION_MAX) {
      return NextResponse.json({ error: `Description must be ${DESCRIPTION_MAX} characters or fewer` }, { status: 400 });
    }

    const duplicate = await prisma.project.findFirst({
      where: { ...accessibleToOwner(ownerId), name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: `A project named "${name}" already exists. Choose a different name.` }, { status: 409 });
    }

    await ensureUserRow(ownerId);
    const project = await prisma.project.create({
      data: { name, description: description || null, ownerId },
    });

    return NextResponse.json(publicProject(project), { status: 201 });
  } catch (error) {
    console.error('Failed to create project', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
