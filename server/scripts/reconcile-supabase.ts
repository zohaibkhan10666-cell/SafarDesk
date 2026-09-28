/**
 * Compares local SQLite with the mirrored Supabase Postgres copy and reports
 * rows that exist only on one side. The mirror upserts, so rows deleted locally
 * (for example smoke-test tenants) stay behind remotely until this repairs them.
 *
 *   npx tsx scripts/reconcile-supabase.ts            dry run, prints differences
 *   npx tsx scripts/reconcile-supabase.ts --apply    push local rows, then delete remote-only rows
 */
import { prisma } from '../src/prisma.js';
import sql from '../src/lib/db.js';
import { syncAll } from '../src/lib/supabaseMirror.js';

type Row = { id: string };

const DELEGATE: Record<string, string> = {
  Organization: 'organization',
  Branch: 'branch',
  User: 'user',
  AuditLog: 'auditLog',
  Plan: 'plan'
};

const TABLES = ['Organization', 'Branch', 'User', 'AuditLog', 'Plan'] as const;
type TableName = (typeof TABLES)[number];

async function diff(table: TableName) {
  const model = (prisma as unknown as Record<string, { findMany: (args: unknown) => Promise<Row[]> }>)[
    DELEGATE[table]
  ];
  if (!model) throw new Error(`No prisma model for ${table}`);

  const local = await model.findMany({ select: { id: true } });
  const remote = (await sql`select id from "${sql.unsafe(table)}"`) as Row[];
  const localIds = new Set(local.map(r => r.id));
  const remoteIds = new Set(remote.map(r => r.id));

  const extra = remote.filter(r => !localIds.has(r.id)).map(r => r.id);
  const missing = local.filter(r => !remoteIds.has(r.id)).map(r => r.id);

  console.log(`${table}: local=${local.length} remote=${remote.length} extraRemote=${extra.length} missingRemote=${missing.length}`);
  if (extra.length) console.log(`  remote only: ${extra.join(', ')}`);
  if (missing.length) console.log(`  local only : ${missing.join(', ')}`);

  return extra;
}

async function main() {
  const apply = process.argv.includes('--apply');

  if (apply) {
    const sync = await syncAll();
    console.log(`push local -> remote: ${sync.message}`);
    if (!sync.ok) throw new Error('mirror sync failed, not deleting anything');
  }

  const extras: Record<string, string[]> = {};
  for (const table of TABLES) extras[table] = await diff(table);

  if (!apply) {
    console.log('\nDRY RUN - rerun with --apply to push local rows and delete remote-only rows.');
    return;
  }

  let removed = 0;
  for (const table of TABLES) {
    for (const id of extras[table]) {
      await sql`delete from "${sql.unsafe(table)}" where id = ${id}`;
      removed += 1;
      console.log(`deleted ${table} ${id}`);
    }
  }
  console.log(`Removed ${removed} remote-only row(s).`);
}

main()
  .catch(err => {
    console.error('RECONCILE FAILED:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
