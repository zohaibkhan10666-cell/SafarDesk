import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Walks up from the current module until the server package root is found.
 * `src/` (tsx dev) and `dist/` (compiled production build) both resolve to the
 * same root, so `.env`, `data/` and `uploads/` keep working in either layout.
 */
function findServerRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const serverRoot = findServerRoot(here);
dotenv.config({ path: path.resolve(serverRoot, '.env') });

const uploadDirOverride = process.env.UPLOAD_DIR;

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.SQLITE_URL || 'file:./dev.db',
  postgresUrl: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  demoPassword: process.env.DEMO_PASSWORD || 'SafarDesk@2026',
  // Local fallback vault (used only when Supabase Storage is not configured).
  uploadDir: path.resolve(serverRoot, uploadDirOverride || 'uploads'),
  // Supabase Storage bucket for uploaded documents (private, server-side only).
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'documents'
};
