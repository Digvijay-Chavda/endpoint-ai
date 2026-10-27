import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAccessibleProject, getOwnerId, notFound, unauthorized } from '@/lib/owner';
import { parseStoredHeaders } from '@/lib/endpoint-input';
import { EXPORT_FORMAT } from '@/lib/project-import';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId();
    if (!ownerId) return unauthorized();
    const project = await findAccessibleProject(id, ownerId);
    if (!project) return notFound();

    const endpoints = await prisma.endpoint.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });

    const payload = {
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      project: { name: project.name, description: project.description },
      endpoints: endpoints.map(ep => ({
        path: ep.path,
        method: ep.method,
        responseBody: ep.responseBody,
        statusCode: ep.statusCode,
        responseHeaders: parseStoredHeaders(ep.responseHeaders),
        latencyMs: ep.latencyMs,
        errorRate: ep.errorRate,
        errorStatusCode: ep.errorStatusCode,
        active: ep.active,
        requireAuth: ep.requireAuth,
        customAuthHeader: ep.customAuthHeader,
        enableCors: ep.enableCors,
      })),
    };

    const filename = `${project.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'project'}.endpoint.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export project', error);
    return NextResponse.json({ error: 'Failed to export project' }, { status: 500 });
  }
}
