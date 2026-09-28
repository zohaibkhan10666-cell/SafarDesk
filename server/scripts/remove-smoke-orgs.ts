/**
 * Removes tenants provisioned by the platform smoke tests ("Smoke Test Agency").
 * The smoke suite provisions an org + HQ branch + owner user through the public
 * API and has no org-delete endpoint to undo it with, so leftovers are cleared
 * here. Organization deletion cascades to its branches, users and audit rows.
 *
 *   npx tsx scripts/remove-smoke-orgs.ts
 */
import { prisma } from '../src/prisma.js';

async function main() {
  const orphans = await prisma.organization.findMany({
    where: { name: 'Smoke Test Agency' },
    select: { id: true, name: true }
  });

  if (!orphans.length) {
    console.log('No smoke-test organization found - nothing to delete.');
    return;
  }

  for (const org of orphans) {
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`deleted ${org.id} (${org.name}) with cascaded rows`);
  }

  console.log(`remaining: organizations=${await prisma.organization.count()} users=${await prisma.user.count()} audits=${await prisma.auditLog.count()}`);
}

main()
  .catch(err => {
    console.error('CLEANUP FAILED:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
