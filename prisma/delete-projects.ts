/**
 * One-off cleanup for the old global projects.
 *
 *   npm run db:delete-projects              → shows what would be deleted (dry run)
 *   npm run db:delete-projects -- --yes     → deletes ownerless (pre-accounts) projects
 *   npm run db:delete-projects -- --all --yes → deletes EVERY project, including users' own
 *
 * Endpoints and request logs are removed with their project (cascade). Users are kept.
 * Runs against whatever DATABASE_URL points at, so check it first.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const all = process.argv.includes("--all");
  const confirmed = process.argv.includes("--yes");
  const where = all ? {} : { ownerId: null };

  const projects = await prisma.project.findMany({
    where,
    select: { id: true, name: true, ownerId: true, _count: { select: { endpoints: true } } },
    orderBy: { createdAt: "asc" },
  });

  const host = (process.env.DATABASE_URL ?? "").replace(/^[a-z+]+:\/\/[^@]*@/i, "").split("/")[0];
  console.log(`Database: ${host || "(DATABASE_URL not set)"}`);
  console.log(`${projects.length} ${all ? "" : "ownerless "}project(s) match:`);
  for (const p of projects) {
    console.log(`  - ${p.name} (${p._count.endpoints} endpoints)${p.ownerId ? " [owned]" : ""}`);
  }

  if (!confirmed) {
    console.log("\nDry run only. Re-run with --yes to delete.");
    return;
  }
  const result = await prisma.project.deleteMany({ where });
  console.log(`\nDeleted ${result.count} project(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
