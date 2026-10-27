import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Projects belong to the signed-in Google user. Every API route (except the public /mock/... URLs)
 * requires a session, and only returns or changes projects owned by that user. Projects with a null
 * owner (from before accounts existed) match nobody, so they are invisible and unreachable.
 */
export async function getOwnerId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Sign in required', code: 'UNAUTHENTICATED' }, { status: 401 });
}

export function accessibleToOwner(ownerId: string) {
  return { ownerId };
}

/** Returns the project if it belongs to this user, otherwise null (treated as 404). */
export async function findAccessibleProject(projectId: string, ownerId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, ...accessibleToOwner(ownerId) },
  });
}

export function notFound(what = 'Project') {
  return NextResponse.json({ error: `${what} not found` }, { status: 404 });
}

export async function findUniqueProjectName(ownerId: string, desired: string): Promise<string> {
  const taken = await prisma.project.findMany({
    where: accessibleToOwner(ownerId),
    select: { name: true },
  });
  const lower = new Set(taken.map(p => p.name.toLowerCase()));
  if (!lower.has(desired.toLowerCase())) return desired;
  for (let i = 2; ; i++) {
    const candidate = `${desired} (${i})`;
    if (!lower.has(candidate.toLowerCase())) return candidate;
  }
}

/** Strips ownerId from API responses. */
export function publicProject<T extends { ownerId?: string | null }>(project: T): Omit<T, 'ownerId'> {
  const rest = { ...project };
  delete rest.ownerId;
  return rest;
}
