import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAccessibleProject, notFound } from '@/lib/owner';
import { toLogEntry } from '@/lib/request-log';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ projectId: string }> };

// GET /api/inspector/[projectId]/logs → latest stored requests, newest first
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { projectId } = await params;
    if (!(await findAccessibleProject(projectId))) return notFound();

    const rows = await prisma.requestLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(rows.map(toLogEntry));
  } catch (error) {
    console.error('Failed to fetch request logs', error);
    return NextResponse.json({ error: 'Failed to fetch request logs' }, { status: 500 });
  }
}

// DELETE /api/inspector/[projectId]/logs → clear stored history
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { projectId } = await params;
    if (!(await findAccessibleProject(projectId))) return notFound();

    await prisma.requestLog.deleteMany({ where: { projectId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to clear request logs', error);
    return NextResponse.json({ error: 'Failed to clear request logs' }, { status: 500 });
  }
}
