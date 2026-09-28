import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth.js';
import { writeAudit } from '../audit.js';
import {
  TENANT_ROLES,
  allowedRolesFor,
  complianceFor,
  flagEnabled,
  getFeatureFlags,
  getPlan,
  listPlans,
  modulesForPlan,
  policy,
  quotaFor
} from '../platformConfig.js';

/**
 * Tenant-facing entitlements (README §19.1 · §19.2).
 *
 * The tenant can only READ what the platform granted: its plan, its quotas,
 * the role categories its plan entitles, and which feature flags are on.
 * Upgrades are requested, never self-served — the Super Admin applies them.
 */
export const entitlementsRouter = Router();
entitlementsRouter.use(requireAuth);

entitlementsRouter.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { organization: true }
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const org = user.organization;
  const planEntry = getPlan(org.plan);
  const allowedRoles = allowedRolesFor(org.plan);
  const modules = modulesForPlan(org.plan);
  const roleDecision = policy.roleAccess(org.plan, user.role);

  res.json({
    plan: planEntry
      ? {
          id: planEntry.id,
          name: planEntry.name,
          price: planEntry.price,
          roles: planEntry.seats,
          branches: planEntry.branches,
          storageGB: planEntry.storageGB,
          features: planEntry.features,
          description: planEntry.description,
          allowedRoles: planEntry.allowedRoles.length ? planEntry.allowedRoles : [...TENANT_ROLES],
          isActive: planEntry.active
        }
      : { id: org.plan, name: org.plan, price: org.mrrPKR, roles: org.usersCount, branches: org.branchesCount, storageGB: Math.max(1, Math.round(org.storageUsedMB / 1024)), features: '', description: '', allowedRoles: [...TENANT_ROLES], isActive: false },
    quotas: quotaFor(org.plan),
    allowedRoles,
    modules,
    role: {
      id: user.role,
      allowed: roleDecision.allowed,
      ruleId: roleDecision.ruleId || null,
      reason: roleDecision.reason || null
    },
    flags: getFeatureFlags().map((flag) => ({
      id: flag.id,
      label: flag.label,
      description: flag.description,
      plans: flag.plans,
      enabled: flagEnabled(flag.id, org.plan)
    })),
    compliance: complianceFor(org),
    catalog: listPlans()
      .filter((entry) => entry.active)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        price: entry.price,
        roles: entry.seats,
        branches: entry.branches,
        storageGB: entry.storageGB,
        features: entry.features,
        description: entry.description,
        allowedRoles: entry.allowedRoles.length ? entry.allowedRoles : [...TENANT_ROLES]
      }))
  });
});

const planRequestSchema = z.object({ planId: z.string().trim().min(1).max(40) });

entitlementsRouter.post('/plan-request', async (req, res) => {
  const parsed = planRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'A plan is required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { organization: true }
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const planEntry = getPlan(parsed.data.planId.toUpperCase());
  if (!planEntry) {
    res.status(400).json({ error: 'Unknown subscription plan', ruleId: 'rule-plan-seats' });
    return;
  }
  if (!planEntry.active) {
    res.status(409).json({
      error: `Plan ${planEntry.name} is not accepting new buyers right now.`,
      ruleId: 'rule-plan-renewal',
      scope: 'PLAN',
      mode: 'HARD_BLOCK'
    });
    return;
  }
  if (planEntry.id === user.organization.plan) {
    res.status(400).json({ error: `${planEntry.name} is already the active plan for this agency.` });
    return;
  }

  await writeAudit({
    user,
    action: 'PLAN_CHANGE_REQUESTED',
    target: planEntry.id,
    details: `${user.organization.name} requested ${planEntry.name} (PKR ${planEntry.price}/mo) — applied by the platform owner from the console`,
    ip: req.ip
  });

  res.json({
    ok: true,
    planId: planEntry.id,
    message: `Plan change to ${planEntry.name} requested. The platform owner reviews and applies it from the Super Admin console.`
  });
});
