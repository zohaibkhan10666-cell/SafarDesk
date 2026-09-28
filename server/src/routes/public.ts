import { Router } from 'express';
import { prisma } from '../prisma.js';

/**
 * Anonymous catalog endpoints — the public marketing site (README §19.1) reads the
 * exact subscription plans the Super Admin authors in the platform console, so home
 * & pricing always advertise current pricing, quotas and features.
 *
 * Mounted without authentication on purpose: no tenant or buyer data leaves here,
 * only the sellable plan cards.
 */
export const publicRouter = Router();

type PublicPlanRow = {
  id: string;
  name: string;
  price: number;
  roles: number;
  branches: number;
  storageGB: number;
  features: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

publicRouter.get('/plans', async (_req, res) => {
  try {
    const rows = (await prisma.plan.findMany()) as unknown as PublicPlanRow[];
    const plans = rows
      .filter((plan) => plan.isActive !== false)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        roles: plan.roles,
        branches: plan.branches,
        storageGB: plan.storageGB,
        features: plan.features,
        description: plan.description || '',
        sortOrder: plan.sortOrder,
        isActive: plan.isActive
      }))
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.price - b.price || a.name.localeCompare(b.name)
      );
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
