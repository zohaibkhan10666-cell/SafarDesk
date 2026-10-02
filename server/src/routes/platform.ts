import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { requireAuth, requirePermission } from '../auth.js';
import { writeAudit } from '../audit.js';
import { serializeOrg } from './auth.js';
import { ROLES } from '../rbac.js';
import { env } from '../env.js';
import {
  TENANT_ROLES,
  allowedRolesFor,
  complianceFor,
  getPlan,
  getPlatformConfig,
  policy,
  refreshPlanCatalog,
  setFeatureFlag,
  updateRule
} from '../platformConfig.js';
import { platformSupabaseRouter } from './platformSupabase.js';
import {
  listContactMessages,
  updateContactMessage,
  removeContactMessage
} from '../contactInbox.js';

export const platformRouter = Router();
platformRouter.use(requireAuth, requirePermission('platform.admin'));
platformRouter.use('/supabase', platformSupabaseRouter);

/* ------------------------------------------------------------------ */
/* Platform configuration authored by the Super Admin (README §19.1)   */
/* ------------------------------------------------------------------ */

platformRouter.get('/config', (_req, res) => {
  res.json(getPlatformConfig());
});

platformRouter.patch('/config/rules/:id', async (req, res) => {
  try {
    const rule = updateRule(req.params.id, {
      mode: req.body?.mode,
      value: req.body?.value
    });
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_CONFIG_UPDATED',
      target: rule.id,
      details: `Rule "${rule.title}" set to ${rule.mode} — value: ${rule.value}`,
      ip: req.ip
    });
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

platformRouter.patch('/config/flags/:id', async (req, res) => {
  try {
    const flag = setFeatureFlag(req.params.id, req.body?.enabled);
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_FLAG_UPDATED',
      target: flag.id,
      details: `Feature flag "${flag.label}" ${flag.enabled ? 'enabled' : 'disabled'} for ${flag.plans.join(', ')}`,
      ip: req.ip
    });
    res.json(flag);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/* ------------------------------------------------------------------ */
/* Subscription plan catalog — create / edit / retire (README §19.1 #1)*/
/* ------------------------------------------------------------------ */

type PlanRow = {
  id: string;
  name: string;
  price: number;
  roles: number;
  branches: number;
  features: string;
  description: string;
  storageGB: number;
  allowedRoles: string;
  sortOrder: number;
  isActive: boolean;
};

function parseAllowedRoles(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) {
      return parsed.filter((role): role is string => typeof role === 'string' && (ROLES as readonly string[]).includes(role));
    }
  } catch {
    // Unreadable allow-list → treated as "every tenant role" below.
  }
  return [];
}

/** Plan rows enriched with the buyers that actually sit on each plan. */
async function planRows() {
  const [plans, orgs] = await Promise.all([
    prisma.plan.findMany(),
    prisma.organization.findMany({ select: { plan: true, mrrPKR: true } })
  ]);
  const buyers = new Map<string, number>();
  const mrr = new Map<string, number>();
  for (const org of orgs) {
    buyers.set(org.plan, (buyers.get(org.plan) || 0) + 1);
    mrr.set(org.plan, (mrr.get(org.plan) || 0) + org.mrrPKR);
  }
  return (plans as PlanRow[])
    .map((plan) => {
      const allowed = parseAllowedRoles(plan.allowedRoles);
      return {
        ...plan,
        allowedRoles: allowed.length ? allowed : [...TENANT_ROLES],
        buyers: buyers.get(plan.id) || 0,
        mrrPKR: mrr.get(plan.id) || 0
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price || a.name.localeCompare(b.name));
}

const planInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  price: z.coerce.number().int().min(0).max(100_000_000),
  roles: z.coerce.number().int().min(1).max(999),
  branches: z.coerce.number().int().min(1).max(999),
  storageGB: z.coerce.number().int().min(0).max(100_000),
  features: z.string().trim().min(1).max(400),
  description: z.string().trim().max(400).optional().default(''),
  allowedRoles: z.array(z.string()).min(1),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  isActive: z.boolean().optional().default(true)
});

// The Super Admin authors each plan's role allow-list (README §19.1 · §19.7);
// no role — AGENCY_OWNER included — is hard-required. Unknown roles still fall
// back to the platform role catalog.
function allowedRolesProblem(roles: string[]) {
  const unknownRole = roles.find((role) => !(ROLES as readonly string[]).includes(role));
  if (unknownRole) {
    return {
      status: 400 as const,
      body: { error: `Unknown role "${unknownRole}" is not part of the platform role catalog.`, ruleId: 'rule-role-catalog' }
    };
  }
  return null;
}

platformRouter.get('/plans', async (_req, res) => {
  res.json({ plans: await planRows() });
});

platformRouter.post('/plans', async (req, res) => {
  try {
    const id = String(req.body?.id || '').trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{1,23}$/.test(id)) {
      res.status(400).json({ error: 'Plan code must be 2–24 characters using A–Z, 0–9 or _ (for example STARTER).' });
      return;
    }
    const parsed = planInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid plan configuration' });
      return;
    }
    const problem = allowedRolesProblem(parsed.data.allowedRoles);
    if (problem) {
      res.status(problem.status).json(problem.body);
      return;
    }
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (existing) {
      res.status(409).json({ error: `A plan with the code ${id} already exists.` });
      return;
    }
    const created = await prisma.plan.create({
      data: { id, ...parsed.data, allowedRoles: JSON.stringify(parsed.data.allowedRoles) }
    });
    await refreshPlanCatalog();
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_PLAN_CREATED',
      target: created.id,
      details: `Plan ${created.name} (${created.id}) created — PKR ${created.price}/mo · ${created.roles} seats · ${created.branches} branches · ${created.storageGB} GB · ${parsed.data.allowedRoles.length} role categories${created.isActive ? '' : ' · inactive'}`,
      ip: req.ip
    });
    res.status(201).json({ plans: await planRows() });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

platformRouter.patch('/plans/:id', async (req, res) => {
  const id = req.params.id;
  const plan = (await prisma.plan.findUnique({ where: { id } })) as PlanRow | null;
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  const patch = planInputSchema.partial().safeParse(req.body);
  if (!patch.success) {
    res.status(400).json({ error: patch.error.issues[0]?.message || 'Invalid plan configuration' });
    return;
  }
  if (patch.data.allowedRoles) {
    const problem = allowedRolesProblem(patch.data.allowedRoles);
    if (problem) {
      res.status(problem.status).json(problem.body);
      return;
    }
  }

  const { allowedRoles, ...rest } = patch.data;
  const updated = await prisma.plan.update({
    where: { id },
    data: { ...rest, ...(allowedRoles ? { allowedRoles: JSON.stringify(allowedRoles) } : {}) }
  });

  if (patch.data.price !== undefined && patch.data.price !== plan.price) {
    await prisma.organization.updateMany({ where: { plan: id }, data: { mrrPKR: patch.data.price } });
  }

  await refreshPlanCatalog();

  const changes: string[] = [];
  const track = (label: string, before: unknown, after: unknown) => {
    if (after !== undefined && after !== before) changes.push(`${label} ${String(before)} → ${String(after)}`);
  };
  track('price PKR', plan.price, patch.data.price);
  track('seats', plan.roles, patch.data.roles);
  track('branches', plan.branches, patch.data.branches);
  track('storage GB', plan.storageGB, patch.data.storageGB);
  track('active', plan.isActive, patch.data.isActive);
  if (patch.data.allowedRoles) changes.push(`role access → ${patch.data.allowedRoles.join(', ')}`);

  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_PLAN_UPDATED',
    target: id,
    details: `Plan ${updated.name} updated — ${changes.length ? changes.join(' · ') : 'no material change'}`,
    ip: req.ip
  });

  res.json({ plans: await planRows() });
});

platformRouter.delete('/plans/:id', async (req, res) => {
  const id = req.params.id;
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  const buyers = await prisma.organization.count({ where: { plan: id } });
  if (buyers > 0) {
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_ENFORCEMENT_BLOCK',
      target: id,
      details: `Delete of plan ${id} rejected — ${buyers} organization(s) still buy it`,
      ip: req.ip
    });
    res.status(409).json({
      error: `${buyers} organization(s) still buy ${plan.name}. Move them to another plan first.`,
      ruleId: 'rule-plan-seats',
      scope: 'PLAN',
      mode: 'HARD_BLOCK',
      buyers
    });
    return;
  }

  await prisma.plan.delete({ where: { id } });
  await refreshPlanCatalog();
  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_PLAN_DELETED',
    target: id,
    details: `Plan ${plan.name} (${id}) deleted — no buyers on this tier`,
    ip: req.ip
  });
  res.json({ plans: await planRows() });
});

/* ------------------------------------------------------------------ */
/* Enforcement report — automatic compliance per plan buyer (§19.2/3)  */
/* ------------------------------------------------------------------ */

platformRouter.get('/enforcement', async (_req, res) => {
  const orgs = await prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
  const tenants = orgs.map(complianceFor);
  const compliant = tenants.filter((tenant) => tenant.status === 'COMPLIANT').length;
  res.json({
    config: getPlatformConfig(),
    tenants,
    summary: {
      tenants: tenants.length,
      compliant,
      atRisk: tenants.filter((tenant) => tenant.status === 'AT RISK').length,
      overLimit: tenants.filter((tenant) => tenant.status === 'OVER LIMIT').length,
      locked: tenants.filter((tenant) => tenant.status === 'LOCKED').length,
      complianceRate: tenants.length ? Math.round((compliant / tenants.length) * 100) : 100
    }
  });
});

/* ------------------------------------------------------------------ */
/* Tenant directory — plan / status writes run through the engine      */
/* ------------------------------------------------------------------ */

platformRouter.get('/organizations', async (_req, res) => {
  const orgs = await prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ organizations: orgs.map(serializeOrg) });
});

const orgPatchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  plan: z.string().trim().min(1).max(40).optional(),
  ownerName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(40).optional(),
  headquarters: z.string().trim().max(80).optional(),
  dtsLicense: z.string().trim().max(40).nullable().optional(),
  branchesCount: z.coerce.number().int().min(0).max(999).optional(),
  usersCount: z.coerce.number().int().min(0).max(999).optional(),
  storageUsedMB: z.coerce.number().int().min(0).max(100_000_000).optional()
});

platformRouter.patch('/organizations/:id', async (req, res) => {
  const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const parsed = orgPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid organization update' });
    return;
  }
  const patch = parsed.data;

  const nextStatus = patch.status ?? org.status;
  const nextPlan = patch.plan ?? org.plan;
  const nextName = patch.name ?? org.name;
  const planEntry = getPlan(nextPlan);
  if (!planEntry) {
    res.status(400).json({ error: 'Unknown subscription plan', ruleId: 'rule-plan-seats' });
    return;
  }
  if (nextPlan !== org.plan && !planEntry.active) {
    res.status(409).json({
      error: `Plan ${planEntry.name} is not accepting buyers right now.`,
      ruleId: 'rule-plan-renewal',
      scope: 'PLAN',
      mode: 'HARD_BLOCK'
    });
    return;
  }

  const planChanged = nextPlan !== org.plan;

  if (planChanged) {
    const blocking = [
      policy.seats(nextPlan, org.usersCount),
      policy.branches(nextPlan, org.branchesCount),
      policy.storage(nextPlan, org.storageUsedMB)
    ].find((decision) => !decision.allowed);

    if (blocking) {
      await writeAudit({
        user: req.user!,
        action: 'PLATFORM_ENFORCEMENT_BLOCK',
        target: org.id,
        details: `Plan change to ${nextPlan} rejected — ${blocking.reason}`,
        ip: req.ip
      });
      res.status(409).json({
        error: blocking.reason,
        ruleId: blocking.ruleId,
        scope: blocking.scope,
        mode: blocking.mode
      });
      return;
    }

    const allowed = allowedRolesFor(nextPlan);
    const holders = await prisma.user.findMany({
      where: { organizationId: org.id, isActive: true },
      select: { role: true }
    });
    const blockedRoles = [...new Set(holders.map((user) => user.role).filter((role) => role !== 'SUPER_ADMIN' && !allowed.includes(role)))];
    if (blockedRoles.length) {
      await writeAudit({
        user: req.user!,
        action: 'PLATFORM_ENFORCEMENT_BLOCK',
        target: org.id,
        details: `Plan change to ${nextPlan} rejected — ${blockedRoles.join(', ')} not entitled on this plan`,
        ip: req.ip
      });
      res.status(409).json({
        error: `Plan ${nextPlan} does not grant the ${blockedRoles.join(', ')} role. Move those users or pick a plan that includes them.`,
        ruleId: 'rule-plan-role-access',
        scope: 'PLAN',
        mode: 'HARD_BLOCK',
        roles: blockedRoles
      });
      return;
    }
  }

  // Growing a counter runs the same quota check as a plan change.
  const quotaGrowth: Array<{ key: string; decision: ReturnType<typeof policy.seats> }> = [];
  if (patch.branchesCount !== undefined && patch.branchesCount > org.branchesCount) {
    quotaGrowth.push({ key: 'branches', decision: policy.branches(nextPlan, patch.branchesCount) });
  }
  if (patch.usersCount !== undefined && patch.usersCount > org.usersCount) {
    quotaGrowth.push({ key: 'seats', decision: policy.seats(nextPlan, patch.usersCount) });
  }
  if (patch.storageUsedMB !== undefined && patch.storageUsedMB > org.storageUsedMB) {
    quotaGrowth.push({ key: 'storage', decision: policy.storage(nextPlan, patch.storageUsedMB) });
  }
  const overQuota = quotaGrowth.find((entry) => !entry.decision.allowed);
  if (overQuota) {
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_ENFORCEMENT_BLOCK',
      target: org.id,
      details: `${overQuota.key} update rejected — ${overQuota.decision.reason}`,
      ip: req.ip
    });
    res.status(409).json({
      error: overQuota.decision.reason,
      ruleId: overQuota.decision.ruleId,
      scope: overQuota.decision.scope,
      mode: overQuota.decision.mode
    });
    return;
  }

  const dtsFlag = policy.dtsPresent(patch.dtsLicense === undefined ? org.dtsLicense : patch.dtsLicense);
  if (dtsFlag.flagged) {
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_POLICY_FLAG',
      target: org.id,
      details: `SOFT WARN · ${dtsFlag.reason}`,
      ip: req.ip
    });
  }

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      status: nextStatus,
      plan: nextPlan,
      name: nextName,
      ownerName: patch.ownerName,
      email: patch.email,
      phone: patch.phone,
      headquarters: patch.headquarters,
      dtsLicense: patch.dtsLicense === undefined ? undefined : patch.dtsLicense || null,
      branchesCount: patch.branchesCount,
      usersCount: patch.usersCount,
      storageUsedMB: patch.storageUsedMB,
      mrrPKR: planChanged ? planEntry.price : org.mrrPKR
    }
  });

  const summary: string[] = [];
  if (planChanged) summary.push(`plan ${org.plan} → ${updated.plan} (PKR ${updated.mrrPKR}/mo)`);
  if (patch.status && patch.status !== org.status) summary.push(`status ${org.status} → ${patch.status}`);
  if (patch.usersCount !== undefined && patch.usersCount !== org.usersCount) summary.push(`seats ${org.usersCount} → ${patch.usersCount}`);
  if (patch.branchesCount !== undefined && patch.branchesCount !== org.branchesCount) summary.push(`branches ${org.branchesCount} → ${patch.branchesCount}`);
  if (patch.storageUsedMB !== undefined && patch.storageUsedMB !== org.storageUsedMB) summary.push(`storage ${org.storageUsedMB} → ${patch.storageUsedMB} MB`);
  if (patch.name && patch.name !== org.name) summary.push(`name → ${patch.name}`);

  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_ORG_UPDATED',
    target: updated.id,
    details: `${updated.name} �?" ${summary.length ? summary.join(', ') : 'configuration saved'} (plan ${updated.plan}, status ${updated.status})`,
    ip: req.ip
  });

  if (org.status === 'PENDING' && updated.status === 'ACTIVE') {
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_ORG_APPROVED',
      target: updated.id,
      details: `${updated.name} approved for sign-in (rule-org-approval) — plan ${updated.plan}`,
      ip: req.ip
    });
  }

  res.json(serializeOrg(updated));
});

/* ------------------------------------------------------------------ */
/* Provisioning a new buyer tenant (§19.3 — plan + quota checked)      */
/* ------------------------------------------------------------------ */

const provisionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().default(''),
  headquarters: z.string().trim().max(80).optional().default('Pakistan'),
  dtsLicense: z.string().trim().max(40).optional().default(''),
  plan: z.string().trim().min(1).max(40).optional().default('STARTER'),
  password: z.string().min(8).max(72).optional()
});

platformRouter.post('/organizations', async (req, res) => {
  const parsed = provisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Agency name, owner and email are required' });
    return;
  }
  const body = parsed.data;
  const planId = body.plan.toUpperCase();

  const planEntry = getPlan(planId);
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

  const roleDecision = policy.roleAccess(planId, 'AGENCY_OWNER');
  if (!roleDecision.allowed) {
    res.status(403).json({
      error: roleDecision.reason,
      ruleId: roleDecision.ruleId,
      scope: roleDecision.scope,
      mode: roleDecision.mode
    });
    return;
  }

  const seatDecision = policy.seats(planId, 0, 1);
  const branchDecision = policy.branches(planId, 0, 1);
  const blocking = [seatDecision, branchDecision].find((decision) => !decision.allowed);
  if (blocking) {
    res.status(409).json({
      error: blocking.reason,
      ruleId: blocking.ruleId,
      scope: blocking.scope,
      mode: blocking.mode
    });
    return;
  }

  const email = body.email.toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const dtsDecision = policy.dtsPresent(body.dtsLicense);
  if (dtsDecision.flagged) {
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_POLICY_FLAG',
      target: body.name,
      details: `SOFT WARN · ${dtsDecision.reason}`,
      ip: req.ip
    });
  }

  const stamp = Date.now();
  const orgId = `org-${stamp}`;
  const branchId = `${orgId}-hq`;
  const userId = `u-${stamp}`;
  const slug =
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) +
    '-' +
    stamp.toString().slice(-4);
  const passwordHash = await bcrypt.hash(body.password || env.demoPassword, 10);

  const org = await prisma.organization.create({
    data: {
      id: orgId,
      name: body.name,
      slug,
      ownerName: body.ownerName,
      email,
      phone: body.phone,
      headquarters: body.headquarters,
      plan: planId,
      status: 'ACTIVE',
      branchesCount: 1,
      usersCount: 1,
      activeCasesCount: 0,
      mrrPKR: planEntry.price,
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      storageUsedMB: 0,
      dtsLicense: body.dtsLicense || null,
      createdDate: new Date().toISOString().slice(0, 10),
      defaultCurrency: 'PKR',
      defaultTimezone: 'Asia/Karachi',
      currenciesJson: JSON.stringify([{ code: 'PKR', symbol: '₨', rateToPKR: 1.0, isDefault: true }]),
      branches: {
        create: { id: branchId, name: 'Head Office', manager: body.ownerName, phone: body.phone, totalStaff: 1 }
      },
      users: {
        create: {
          id: userId,
          name: body.ownerName,
          email,
          passwordHash,
          role: 'AGENCY_OWNER',
          branchId,
          avatar: body.ownerName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        }
      }
    }
  });

  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_ORG_PROVISIONED',
    target: org.id,
    details: `${org.name} provisioned on ${planEntry.name} — PKR ${planEntry.price}/mo · owner ${body.ownerName} · DTS ${org.dtsLicense || 'pending'}`,
    ip: req.ip
  });

  res.status(201).json(serializeOrg(org));
});

/* ------------------------------------------------------------------ */
/* Role activity across all tenants (README §19.4)                     */
/* ------------------------------------------------------------------ */

platformRouter.get('/roles', async (_req, res) => {
  const [users, logs, tenantCount] = await Promise.all([
    prisma.user.findMany({ select: { role: true, organizationId: true, isActive: true } }),
    prisma.auditLog.findMany({ select: { role: true, action: true, details: true, createdAt: true } }),
    prisma.organization.count()
  ]);

  const now = Date.now();
  const DAY = 86400000;
  const ageOf = (log: { createdAt: Date }) => now - new Date(log.createdAt).getTime();
  const isDenial = (log: { action: string; details: string }) =>
    /BLOCK|DENIED|DENY|REJECT/i.test(log.action) || /denied|rejected|blocked|exceed/i.test(log.details);

  const roles = (ROLES as readonly string[]).map((role) => {
    const holders = users.filter((user) => user.role === role);
    const mine = logs.filter((log) => log.role === role);
    const recent = mine.filter((log) => ageOf(log) <= 30 * DAY);
    const previous = mine.filter((log) => ageOf(log) > 30 * DAY && ageOf(log) <= 60 * DAY);
    const workActions = recent.filter((log) => log.action !== 'LOGIN');
    const tally = new Map<string, number>();
    for (const log of workActions) tally.set(log.action, (tally.get(log.action) || 0) + 1);
    const topAction = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const actions30d = recent.length;
    const trend =
      actions30d === 0 ? 'QUIET' : actions30d >= Math.max(1, previous.length) * 1.15 ? 'UP' : 'STABLE';

    return {
      role,
      users: holders.length,
      tenants: new Set(holders.map((user) => user.organizationId)).size,
      actions30d,
      logins30d: recent.filter((log) => log.action === 'LOGIN').length,
      denied30d: recent.filter(isDenial).length,
      topAction,
      trend,
      lastActive: mine.length
        ? new Date(Math.max(...mine.map((log) => new Date(log.createdAt).getTime())))
            .toISOString()
            .slice(0, 16)
            .replace('T', ' ')
        : '—'
    };
  });

  res.json({ roles, tenants: tenantCount });
});

/* ------------------------------------------------------------------ */
/* Platform audit stream (README §19.2 — every allow/deny is recorded) */
/* ------------------------------------------------------------------ */

platformRouter.get('/audit', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 200);
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      actor: true,
      role: true,
      action: true,
      target: true,
      details: true,
      branch: true,
      organizationId: true
    }
  });
  res.json({ logs });
});

/* ------------------------------------------------------------------ */
/* Contact requests submitted on the public site (home & contact       */
/* sections) � platform-owned rows, never part of a tenant partition.  */
/* ------------------------------------------------------------------ */

platformRouter.get('/contact-messages', (_req, res) => {
  res.json({ messages: listContactMessages() });
});

platformRouter.patch('/contact-messages/:id', async (req, res) => {
  const status = String(req.body?.status || '').toUpperCase();
  if (status !== 'NEW' && status !== 'READ') {
    return res.status(400).json({ error: 'status must be NEW or READ' });
  }
  const updated = updateContactMessage(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Contact request not found' });
  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_CONTACT_UPDATED',
    target: updated.id,
    details: `Contact request from ${updated.email} marked ${updated.status}`,
    ip: req.ip
  }).catch(() => {
    // Audit trail is best-effort — the inbox status change already landed.
  });
  res.json({ message: updated });
});

platformRouter.delete('/contact-messages/:id', async (req, res) => {
  const removed = removeContactMessage(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Contact request not found' });
  await writeAudit({
    user: req.user!,
    action: 'PLATFORM_CONTACT_DELETED',
    target: req.params.id,
    details: 'Contact request removed from the platform inbox',
    ip: req.ip
  }).catch(() => {
    // Audit trail is best-effort — the row is already gone from the inbox.
  });
  res.json({ deleted: true });
});
