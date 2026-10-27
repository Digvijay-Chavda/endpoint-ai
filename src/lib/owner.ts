import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Lightweight, login-free ownership. Each browser gets a random id in an httpOnly cookie and
 * projects are scoped to it. This keeps strangers from listing, editing or deleting your projects,
 * but it is not an account system: clearing cookies loses access, and projects cannot be shared.
 * Projects with a null ownerId were created before ownership existed and stay open to everyone.
 * Mock URLs (/mock/...) are always public so they can be shared.
 */
const OWNER_COOKIE = 'endpoint_owner';
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getOwnerId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(OWNER_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;

  const ownerId = randomUUID();
  store.set(OWNER_COOKIE, ownerId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });
  return ownerId;
}

export function accessibleToOwner(ownerId: string) {
  return { OR: [{ ownerId }, { ownerId: null }] };
}

/** Returns the project if the current browser may access it, otherwise null (treated as 404). */
export async function findAccessibleProject(projectId: string) {
  const ownerId = await getOwnerId();
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

/** Strips ownerId from API responses — it equals the httpOnly owner cookie value. */
export function publicProject<T extends { ownerId?: string | null }>(project: T): Omit<T, 'ownerId'> {
  const rest = { ...project };
  delete rest.ownerId;
  return rest;
}
