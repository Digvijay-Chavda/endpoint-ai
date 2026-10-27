import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sampleProject } from '@/lib/sample-project';

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

/**
 * Called on every sign-in. Refreshes the profile; for a brand-new user it also creates the starter
 * sample project in the same transaction, so deleting that project later never brings it back.
 */
export async function upsertUserWithSample(user: UserProfile) {
  const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
  if (existing) {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: user.email, name: user.name, image: user.image },
    });
    return;
  }
  try {
    await prisma.user.create({ data: { ...user, projects: { create: [sampleProject()] } } });
  } catch (error) {
    // Two simultaneous first sign-ins: the other request created the user (and sample) first.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
  }
}

/** Guards against a valid session whose user row is missing (e.g. after a database reset). */
export async function ensureUserRow(id: string) {
  await prisma.user.upsert({ where: { id }, update: {}, create: { id } });
}
