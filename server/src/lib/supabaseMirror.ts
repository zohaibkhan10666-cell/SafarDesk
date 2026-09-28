import { prisma } from '../prisma.js';
import { getSupabaseAdmin, probeSupabase, supabaseEnvInfo } from './supabase.js';
import { EXPECTED_TABLES } from './supabaseSchema.js';

export type SyncResult = {
  table: string;
  local: number;
  written: number;
  remote: number | null;
  error?: string;
};

const BATCH_SIZE = 400;

/** Prisma delegate key for a model name: `Organization` → `organization`. */
function delegateName(model: string) {
  return model[0].toLowerCase() + model.slice(1);
}

/** Tables whose primary key is not a bare `id`. */
const ON_CONFLICT: Record<string, string> = {
  TenantRecord: 'organizationId,collection,id'
};

async function upsertBatches(table: string, rows: Array<Record<string, unknown>>) {
  const admin = getSupabaseAdmin();
  const onConflict = ON_CONFLICT[table] ?? 'id';
  let written = 0;
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const slice = rows.slice(index, index + BATCH_SIZE);
    const { error } = await admin.from(table).upsert(slice as never, { onConflict });
    if (error) throw new Error(error.message);
    written += slice.length;
  }
  return written;
}

async function remoteCount(table: string) {
  const admin = getSupabaseAdmin();
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Mirrors every Prisma table into Supabase Postgres through PostgREST.
 * Local SQLite stays the app's primary store; Supabase holds a live copy
 * that the Super Admin console can verify row by row.
 */
export async function syncAll(): Promise<{ ok: boolean; results: SyncResult[]; message: string }> {
  const info = supabaseEnvInfo();
  if (!info.configured || !info.hasSecretKey) {
    return { ok: false, results: [], message: info.error ?? 'Supabase is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).' };
  }

  const results: SyncResult[] = [];
  let tablesMissing = false;

  for (const table of EXPECTED_TABLES) {
    const delegate = (prisma as unknown as Record<string, { findMany: () => Promise<Array<Record<string, unknown>>> }>)[
      delegateName(table)
    ];
    if (!delegate) {
      results.push({ table, local: 0, written: 0, remote: null, error: `Prisma model ${table} not found` });
      continue;
    }

    try {
      const rows = await delegate.findMany();
      const written = rows.length ? await upsertBatches(table, rows) : 0;
      const remote = await remoteCount(table);
      results.push({ table, local: rows.length, written, remote });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('Could not find the table')) tablesMissing = true;
      results.push({ table, local: 0, written: 0, remote: null, error: message });
    }
  }

  const failed = results.filter((result) => result.error);
  if (tablesMissing) {
    return {
      ok: false,
      results,
      message: 'Supabase tables do not exist yet — apply the schema first (Platform → Database → Apply schema).'
    };
  }
  if (failed.length) {
    const names = failed.map((result) => result.table).join(', ');
    return { ok: false, results, message: `${failed.length} table(s) failed to sync (${names}).` };
  }
  const total = results.reduce((sum, result) => sum + result.written, 0);
  return { ok: true, results, message: `Mirrored ${total} row(s) into Supabase.` };
}

let mirrorTimer: ReturnType<typeof setInterval> | null = null;
let mirrorRunning = false;
let mirrorReady: boolean | null = null;

/** How often the background mirror re-copies local rows into Supabase. */
export const MIRROR_INTERVAL_MS = 60_000;

/**
 * Keeps the Supabase copy current without rewriting every write route:
 * re-mirrors on an interval once the schema exists. Probes once (and again
 * after any failure) instead of on every tick, skips a tick while a sync is
 * still in flight, and never lets a failure escape the timer.
 */
export function startBackgroundMirror(intervalMs = MIRROR_INTERVAL_MS) {
  if (mirrorTimer) return;
  mirrorTimer = setInterval(async () => {
    if (mirrorRunning) return;
    mirrorRunning = true;
    try {
      if (mirrorReady !== true) {
        const probe = await probeSupabase([...EXPECTED_TABLES]);
        mirrorReady = probe.ready;
        if (!mirrorReady) return;
      }
      const result = await syncAll();
      if (!result.ok) {
        mirrorReady = null;
        console.warn('[supabase mirror]', result.message);
      }
    } catch (error) {
      mirrorReady = null;
      console.warn('[supabase mirror]', (error as Error).message);
    } finally {
      mirrorRunning = false;
    }
  }, intervalMs);
  if (typeof mirrorTimer.unref === 'function') mirrorTimer.unref();
}
