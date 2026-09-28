import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env.js';
import { prisma } from './prisma.js';
import { authRouter } from './routes/auth.js';
import { workspaceRouter } from './routes/workspace.js';
import { platformRouter } from './routes/platform.js';
import { entitlementsRouter } from './routes/entitlements.js';
import { collectionsRouter } from './routes/collections.js';
import { documentsRouter } from './routes/documents.js';
import { reportsRouter } from './routes/reports.js';
import { publicRouter } from './routes/public.js';
import { startBackgroundMirror } from './lib/supabaseMirror.js';
import { refreshPlanCatalog } from './platformConfig.js';

fs.mkdirSync(env.uploadDir, { recursive: true });

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: '4mb' }));
app.use('/uploads', express.static(path.resolve(env.uploadDir)));

app.use(
  '/api/v1/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false }),
  authRouter
);
app.use('/api/v1/workspace', workspaceRouter);
app.use('/api/v1/platform', platformRouter);
app.use('/api/v1/entitlements', entitlementsRouter);
app.use('/api/v1/collections', collectionsRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/reports', reportsRouter);
// Anonymous plan catalog for the public marketing site (home & pricing sections).
app.use('/api/v1/public', publicRouter);

app.get('/api/v1/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, service: 'safardesk-api', time: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`SafarDesk API listening on http://localhost:${env.port}`);
  void refreshPlanCatalog();
  startBackgroundMirror();
});
