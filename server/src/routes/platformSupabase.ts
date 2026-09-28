import { Router } from 'express';
import { prisma } from '../prisma.js';
import { writeAudit } from '../audit.js';
import { getSupabaseAdmin, probeSupabase, supabaseEnvInfo } from '../lib/supabase.js';
import { syncAll, MIRROR_INTERVAL_MS } from '../lib/supabaseMirror.js';
import {
  EXPECTED_TABLES,
  MIGRATION_FILE,
  PLAN_MIGRATION_FILE,
  applySchema,
  fullMigrationSql,
  postgresChannel,
  postgresHost,
  sqlEditorUrl
} from '../lib/supabaseSchema.js';

export const platformSupabaseRouter = Router();

function setupInfo() {
  const dsn = postgresChannel();
  return {
    migrationFile: MIGRATION_FILE.replace(/\\/g, '/'),
    migrationFiles: [MIGRATION_FILE, PLAN_MIGRATION_FILE].map((file) => file.replace(/\\/g, '/')),
    sqlBytes: fullMigrationSql().length,
    dashboardUrl: sqlEditorUrl(),
    tables: [...EXPECTED_TABLES],
    host: postgresHost(),
    mirrorIntervalMs: MIRROR_INTERVAL_MS,
    channels: {
      databaseUrl: Boolean(dsn),
      dsnVar: dsn?.name ?? null,
      accessToken: Boolean(process.env.SUPABASE_ACCESS_TOKEN)
    }
  };
}

/** Row counts in the local (SQLite) primary store, for side-by-side comparison. */
async function localCounts(): Promise<Record<string, number>> {
  const delegates = prisma as unknown as Record<string, { count?: () => Promise<number> }>;
  const counts: Record<string, number> = {};
  for (const table of EXPECTED_TABLES) {
    const delegate = delegates[table[0].toLowerCase() + table.slice(1)];
    counts[table] = delegate?.count ? await delegate.count() : 0;
  }
  return counts;
}

platformSupabaseRouter.get('/', async (_req, res) => {
  res.json({
    env: supabaseEnvInfo(),
    probe: await probeSupabase([...EXPECTED_TABLES]),
    local: await localCounts(),
    setup: setupInfo(),
    time: new Date().toISOString()
  });
});

platformSupabaseRouter.get('/sql', (_req, res) => {
  res.type('text/plain').send(fullMigrationSql());
});

/** Reads real rows back out of Supabase — the fetch half of the integration. */
platformSupabaseRouter.get('/preview', async (req, res) => {
  const table = String(req.query.table ?? 'Organization');
  const parsed = Number.parseInt(String(req.query.limit ?? '5'), 10);
  const limit = Math.min(Math.max(Number.isNaN(parsed) ? 5 : parsed, 1), 20);
  if (!(EXPECTED_TABLES as readonly string[]).includes(table)) {
    res.status(400).json({ error: 'Unknown table' });
    return;
  }
  try {
    const admin = getSupabaseAdmin();
    const { data, error, count } = await admin.from(table).select('*', { count: 'exact' }).limit(limit);
    if (error) {
      res.status(422).json({ table, error: error.message });
      return;
    }
    res.json({ table, limit, count: count ?? 0, rows: data ?? [], time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ table, error: (error as Error).message });
  }
});

platformSupabaseRouter.post('/setup', async (req, res) => {
  const setup = await applySchema();
  let sync = null;
  if (setup.ok) {
    sync = await syncAll();
  }
  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_SUPABASE_SETUP',
    target: 'supabase-schema',
    details: setup.ok
      ? `Schema applied via ${setup.channel}${sync ? ` — ${sync.message}` : ''}`
      : `Schema setup not applied (${setup.channel}): ${setup.message}`,
    ip: req.ip
  });
  res.status(setup.ok ? 200 : 422).json({ setup, sync, setupInfo: setupInfo() });
});

platformSupabaseRouter.post('/sync', async (req, res) => {
  const sync = await syncAll();
  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_SUPABASE_SYNC',
    target: 'supabase-mirror',
    details: sync.message,
    ip: req.ip
  });
  res.status(sync.ok ? 200 : 422).json({ sync, probe: await probeSupabase([...EXPECTED_TABLES]) });
});
