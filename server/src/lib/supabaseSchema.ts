import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { probeSupabase } from './supabase.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Tables produced by `prisma migrate diff` — mirrors prisma/schema.prisma. */
export const EXPECTED_TABLES = [
  'Organization',
  'Branch',
  'User',
  'Session',
  'TenantRecord',
  'Document',
  'AuditLog',
  'Plan'
] as const;

export const MIGRATION_FILE = path.resolve(here, '../../supabase/migrations/0001_init.sql');
export const PLAN_MIGRATION_FILE = path.resolve(here, '../../supabase/migrations/0002_plan_catalog.sql');
export const SCHEMA_FILE = path.resolve(here, '../../supabase/schema.prisma');

function readSql(file: string): string {
  if (!fs.existsSync(file)) {
    throw new Error(`Migration file not found: ${file}`);
  }
  return fs.readFileSync(file, 'utf8');
}

/** Base schema (tables + RLS) — everything a fresh project needs. */
export function migrationSql(): string {
  return readSql(MIGRATION_FILE);
}

/** Plan catalog columns (Super Admin plan management) — safe to re-run. */
export function planMigrationSql(): string {
  return readSql(PLAN_MIGRATION_FILE);
}

/** Full SQL surface: base schema first, then the plan catalog columns. */
export function fullMigrationSql(): string {
  return `${migrationSql()}\n${planMigrationSql()}`;
}

export function projectRef(): string | null {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return null;
  }
}

export function sqlEditorUrl(): string | null {
  const ref = projectRef();
  return ref ? `https://supabase.com/dashboard/project/${ref}/sql` : null;
}

export type SetupChannel = 'SUPABASE_DB_URL' | 'DATABASE_URL' | 'SUPABASE_ACCESS_TOKEN' | 'none';

export type SetupResult = {
  ok: boolean;
  channel: SetupChannel;
  message: string;
  sqlBytes?: number;
  dashboardUrl?: string | null;
  needs?: string[];
};

/** Which Postgres DSN to use, and under which env var name it lives. */
export function postgresChannel(): { name: SetupChannel; value: string } | null {
  const candidates: [SetupChannel, string | undefined][] = [
    ['SUPABASE_DB_URL', process.env.SUPABASE_DB_URL],
    ['DATABASE_URL', process.env.DATABASE_URL]
  ];
  for (const [name, value] of candidates) {
    if (value && /^postgres(ql)?:\/\//i.test(value)) return { name, value };
  }
  return null;
}

/** Host of the configured Postgres DSN, for the console's connection details. */
export function postgresHost(): string | null {
  const channel = postgresChannel();
  if (!channel) return null;
  try {
    return new URL(channel.value).host;
  } catch {
    return null;
  }
}

async function withConnection<T>(run: (db: import('postgres').Sql) => Promise<T>): Promise<T> {
  const { default: db } = await import('./db.js');
  try {
    return await run(db);
  } finally {
    await db.end({ timeout: 1 });
  }
}

/** True once the Plan table carries the plan-catalog columns (0002 applied). */
async function planCatalogColumnsReady(db: import('postgres').Sql): Promise<boolean> {
  const rows = await db`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Plan' AND column_name = 'storageGB'
  `;
  return rows.length > 0;
}

async function applyWithConnectionUrl(): Promise<string> {
  return withConnection(async (db) => {
    const probe = await probeSupabase([...EXPECTED_TABLES]);
    const applied: string[] = [];

    if (probe.missingTables.length > 0) {
      await db.unsafe(migrationSql());
      applied.push(`base schema ${migrationSql().length} bytes`);
    }

    if (!(await planCatalogColumnsReady(db))) {
      await db.unsafe(planMigrationSql());
      applied.push(`plan catalog columns ${planMigrationSql().length} bytes`);
    }

    return applied.length
      ? `Schema applied through the Postgres connection string: ${applied.join(', ')}.`
      : `Schema already present in Supabase (${EXPECTED_TABLES.length} tables + plan catalog columns) — nothing to create.`;
  });
}

async function applyWithAccessToken(sql: string): Promise<void> {
  const ref = projectRef();
  const token = process.env.SUPABASE_ACCESS_TOKEN!;
  if (!ref) throw new Error('SUPABASE_URL does not contain a project ref');
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase Management API ${response.status}: ${text.slice(0, 300)}`);
  }
}

/**
 * Creates the app schema in Supabase Postgres.
 * API keys cannot run DDL, so this needs one of two channels:
 *   SUPABASE_DB_URL       — direct/pooled Postgres connection string
 *   SUPABASE_ACCESS_TOKEN — Supabase personal access token (Management API)
 * Without a channel it returns the SQL and the SQL editor link instead.
 */
export async function applySchema(): Promise<SetupResult> {
  const sql = fullMigrationSql();

  const dsn = postgresChannel();
  if (dsn) {
    try {
      const message = await applyWithConnectionUrl();
      return { ok: true, channel: dsn.name, message, sqlBytes: sql.length };
    } catch (error) {
      const message = (error as Error).message;
      // Re-running the migration on an existing schema: accept it if the tables are there.
      const after = await probeSupabase([...EXPECTED_TABLES]);
      if (after.missingTables.length === 0) {
        return {
          ok: true,
          channel: dsn.name,
          message: `Schema already present in Supabase (${EXPECTED_TABLES.length} tables).`,
          sqlBytes: sql.length
        };
      }
      return { ok: false, channel: dsn.name, message, sqlBytes: sql.length };
    }
  }

  if (process.env.SUPABASE_ACCESS_TOKEN) {
    try {
      await applyWithAccessToken(sql);
      return {
        ok: true,
        channel: 'SUPABASE_ACCESS_TOKEN',
        message: `Schema applied through the Supabase Management API (${sql.length} bytes).`,
        sqlBytes: sql.length
      };
    } catch (error) {
      return { ok: false, channel: 'SUPABASE_ACCESS_TOKEN', message: (error as Error).message, sqlBytes: sql.length };
    }
  }

  return {
    ok: false,
    channel: 'none',
    message:
      'Supabase accepts API keys for reads/writes but not DDL. Add DATABASE_URL (or SUPABASE_DB_URL / SUPABASE_ACCESS_TOKEN) to server/.env, or paste the migration into the SQL editor once.',
    sqlBytes: sql.length,
    dashboardUrl: sqlEditorUrl(),
    needs: ['DATABASE_URL', 'SUPABASE_ACCESS_TOKEN']
  };
}
