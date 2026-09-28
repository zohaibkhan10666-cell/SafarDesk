import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';
import { policy } from './platformConfig.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Automatic enforcement middleware (README §19.2).
 *
 * Runs on every mutating request: a suspended organization loses all write
 * access platform-wide, no matter which role or local setting is used.
 */
export async function enforceTenantPolicy(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method) || !req.user || req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { status: true }
    });
    const decision = policy.tenantWritable({ status: org?.status || 'SUSPENDED' });
    if (!decision.allowed) {
      res.status(403).json({
        error: decision.reason,
        ruleId: decision.ruleId,
        scope: decision.scope,
        mode: decision.mode
      });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}
