import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../env.js';
import { getSupabaseAdmin, supabaseEnvInfo } from './supabase.js';

/**
 * Document vault storage (README §document storage).
 *
 * Primary backend: **Supabase Storage** — objects live in a private bucket and
 * survive redeploys, container restarts and platform migrations. A local-disk
 * vault (server/uploads) is only used as a fallback when Supabase Storage is not
 * configured, so dev environments without credentials keep working.
 *
 * `storagePath` is what the `Document` row persists: the bucket object key
 * (`<organizationId>/<uuid><ext>`) when stored remotely, or the relative file
 * name when stored locally.
 */

/** Every upload is capped here (multer limit + bucket file-size limit). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export type IncomingFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

let bucketReady = false;

function supabaseReady(): boolean {
  const info = supabaseEnvInfo();
  return Boolean(info.configured && info.hasSecretKey);
}

function safeSegment(value: string): string {
  return String(value || '').replace(/[^A-Za-z0-9_-]/g, '') || 'tenant';
}

/** Creates the private documents bucket on first use (idempotent). */
async function ensureBucket(): Promise<boolean> {
  if (!supabaseReady()) return false;
  if (bucketReady) return true;
  try {
    const admin = getSupabaseAdmin();
    const { error: existing } = await admin.storage.getBucket(env.supabaseStorageBucket);
    if (!existing) {
      bucketReady = true;
      return true;
    }
    const { error: created } = await admin.storage.createBucket(env.supabaseStorageBucket, {
      public: false,
      fileSizeLimit: MAX_UPLOAD_BYTES
    });
    if (created && !/already exists/i.test(created.message)) {
      console.warn(`[storage] could not create bucket "${env.supabaseStorageBucket}": ${created.message}`);
      return false;
    }
    bucketReady = true;
    return true;
  } catch (error) {
    console.warn(`[storage] bucket check failed: ${(error as Error).message}`);
    return false;
  }
}

function localPathFor(storagePath: string): string | null {
  const resolved = path.resolve(env.uploadDir, storagePath);
  const root = path.resolve(env.uploadDir);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

function writeLocal(storagePath: string, buffer: Buffer): string {
  const filePath = localPathFor(storagePath);
  if (!filePath) throw new Error('Unsafe storage path');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return storagePath;
}

/**
 * Persists an upload and returns its `storagePath`.
 * Supabase Storage first; local disk only when Storage is unavailable.
 */
export async function putDocument(organizationId: string, file: IncomingFile): Promise<string> {
  const ext = path.extname(file.originalname).slice(0, 12).replace(/[^.A-Za-z0-9]/g, '');
  const objectName = `${randomUUID()}${ext}`;
  const key = `${safeSegment(organizationId)}/${objectName}`;

  if (await ensureBucket()) {
    try {
      const admin = getSupabaseAdmin();
      const { error } = await admin.storage.from(env.supabaseStorageBucket).upload(key, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
      if (!error) return key;
      console.warn(`[storage] Supabase upload failed (${error.message}) — falling back to local disk`);
    } catch (error) {
      console.warn(`[storage] Supabase upload failed (${(error as Error).message}) — falling back to local disk`);
    }
  }
  return writeLocal(key, file.buffer);
}

/** Reads stored bytes — local vault first (fast, keeps legacy rows working), then Supabase Storage. */
export async function readDocument(storagePath: string): Promise<Buffer | null> {
  const filePath = localPathFor(storagePath);
  if (filePath && fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath);
    } catch {
      // fall through to Supabase Storage
    }
  }

  if (supabaseReady()) {
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.storage.from(env.supabaseStorageBucket).download(storagePath);
      if (data && !error) return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      console.warn(`[storage] Supabase download failed for ${storagePath}: ${(error as Error).message}`);
    }
  }
  return null;
}

/** Best-effort cleanup of both backends — never throws. */
export async function removeDocument(storagePath: string): Promise<void> {
  const filePath = localPathFor(storagePath);
  if (filePath) {
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // ignore — local cleanup is best effort
    }
  }
  if (supabaseReady()) {
    try {
      const admin = getSupabaseAdmin();
      await admin.storage.from(env.supabaseStorageBucket).remove([storagePath]);
    } catch (error) {
      console.warn(`[storage] Supabase remove failed for ${storagePath}: ${(error as Error).message}`);
    }
  }
}
