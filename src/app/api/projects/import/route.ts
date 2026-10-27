import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findUniqueProjectName, getOwnerId, publicProject, unauthorized } from '@/lib/owner';
import { ensureUserRow } from '@/lib/users';
import { parseProjectImport } from '@/lib/project-import';

export const dynamic = 'force-dynamic';

// POST /api/projects/import  { content: <object | JSON string>, name?: string }
export async function POST(request: Request) {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const body = await request.json().catch(() => null);
    if (!body || body.content === undefined) {
      return NextResponse.json({ error: 'Request body must have a "content" field.' }, { status: 400 });
    }

    const parsed = parseProjectImport(body.content);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const requested = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : parsed.name;
    const name = await findUniqueProjectName(ownerId, requested);

    await ensureUserRow(ownerId);
    const project = await prisma.project.create({
      data: {
        name,
        description: parsed.description,
        ownerId,
        endpoints: { create: parsed.endpoints },
      },
    });

    return NextResponse.json(
      { ...publicProject(project), importedEndpoints: parsed.endpoints.length, source: parsed.source },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to import project', error);
    return NextResponse.json({ error: 'Failed to import project' }, { status: 500 });
  }
}
