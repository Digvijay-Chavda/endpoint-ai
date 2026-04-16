import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateEndpointInput } from '@/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body: UpdateEndpointInput = await request.json();
    
    // Standardize path if provided
    let normalizedPath = body.path;
    if (normalizedPath && !normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }

    const endpoint = await prisma.endpoint.update({
      where: { id: resolvedParams.id },
      data: {
        ...body,
        ...(normalizedPath && { path: normalizedPath }),
      },
    });

    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Failed to update endpoint', error);
    return NextResponse.json({ error: 'Failed to update endpoint' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.endpoint.delete({
      where: { id: resolvedParams.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete endpoint', error);
    return NextResponse.json({ error: 'Failed to delete endpoint' }, { status: 500 });
  }
}
