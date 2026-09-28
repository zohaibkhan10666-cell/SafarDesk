import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { signToken, requireAuth } from '../auth.js';
import { env } from '../env.js';
import { writeAudit } from '../audit.js';
import { verifySupabaseJwt } from '../lib/supabase.js';
import { getPlan, policy } from '../platformConfig.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
  agency: z.string().min(2).optional(),
  plan: z.string().optional()
});

/** Password policy is a platform rule (rule-user-password) — enforced on account creation. */
const registrationSchema = credentialsSchema.extend({
  password: z.string().min(12, 'Password must be at least 12 characters (platform password policy)')
});

authRouter.post('/login', async (req, res) => {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid email and password are required' });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email },
    include: { organization: true, branch: true }
  });
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  if (user.organization.status !== 'ACTIVE' && user.role !== 'SUPER_ADMIN') {
    const signInDecision = policy.signIn(user.organization);
    await writeAudit({
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId
      },
      action: 'PLATFORM_ENFORCEMENT_BLOCK',
      target: user.email,
      details: `Sign-in denied — ${signInDecision.reason || 'workspace not active'}`,
      ip: req.ip
    });
    res.status(403).json({
      error: signInDecision.reason || 'This agency workspace is not active',
      ruleId: signInDecision.ruleId || 'rule-org-approval',
      scope: signInDecision.scope,
      mode: signInDecision.mode,
      status: user.organization.status
    });
    return;
  }
  const authUser = {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId
  };
  if (user.role !== 'SUPER_ADMIN') {
    const roleDecision = policy.roleAccess(user.organization.plan, user.role);
    if (!roleDecision.allowed) {
      await writeAudit({
        user: authUser,
        action: 'PLATFORM_ENFORCEMENT_BLOCK',
        target: user.email,
        details: `Login denied — ${roleDecision.reason}`,
        ip: req.ip
      });
      res.status(403).json({
        error: roleDecision.reason,
        ruleId: roleDecision.ruleId,
        scope: roleDecision.scope,
        mode: roleDecision.mode
      });
      return;
    }
  }
  const token = signToken(authUser);
  await writeAudit({
    user: authUser,
    action: 'LOGIN',
    target: user.email,
    details: 'User signed in',
    ip: req.ip
  });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      avatar: user.avatar,
      phone: user.phone
    },
    organization: serializeOrg(user.organization)
  });
});

authRouter.post('/supabase', async (req, res) => {
  const header = req.headers.authorization || '';
  const token =
    (typeof req.body?.supabase_token === 'string' && req.body.supabase_token) ||
    (header.startsWith('Bearer ') ? header.slice(7) : '');
  if (!token) {
    res.status(400).json({ error: 'A Supabase access token is required' });
    return;
  }

  const verified = await verifySupabaseJwt(token);
  if (!verified.ok) {
    res.status(401).json({ error: verified.error });
    return;
  }

  const email = (verified.claims.email || '').toLowerCase();
  if (!email) {
    res.status(401).json({ error: 'Supabase token has no email claim' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { email },
    include: { organization: true, branch: true }
  });
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'No SafarDesk account matches this Supabase user' });
    return;
  }
  if (user.organization.status !== 'ACTIVE' && user.role !== 'SUPER_ADMIN') {
    const signInDecision = policy.signIn(user.organization);
    res.status(403).json({
      error: signInDecision.reason || 'This agency workspace is not active',
      ruleId: signInDecision.ruleId || 'rule-org-approval',
      scope: signInDecision.scope,
      mode: signInDecision.mode,
      status: user.organization.status
    });
    return;
  }

  const authUser = {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId
  };
  if (user.role !== 'SUPER_ADMIN') {
    const roleDecision = policy.roleAccess(user.organization.plan, user.role);
    if (!roleDecision.allowed) {
      await writeAudit({
        user: authUser,
        action: 'PLATFORM_ENFORCEMENT_BLOCK',
        target: user.email,
        details: `Login denied (Supabase) — ${roleDecision.reason}`,
        ip: req.ip
      });
      res.status(403).json({
        error: roleDecision.reason,
        ruleId: roleDecision.ruleId,
        scope: roleDecision.scope,
        mode: roleDecision.mode
      });
      return;
    }
  }
  const supabaseSessionToken = signToken(authUser);
  await writeAudit({
    user: authUser,
    action: 'LOGIN',
    target: user.email,
    details: 'User signed in with Supabase Auth',
    ip: req.ip
  });
  res.json({
    token: supabaseSessionToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      avatar: user.avatar,
      phone: user.phone
    },
    organization: serializeOrg(user.organization)
  });
});

authRouter.post('/register', async (req, res) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Name, agency, email and password are required' });
    return;
  }

  const planId = (parsed.data.plan || 'STARTER').toUpperCase();
  const planEntry = getPlan(planId);
  if (!planEntry) {
    res.status(400).json({ error: 'That subscription plan is not available.', ruleId: 'rule-plan-seats' });
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
  const quotaBlocking = [policy.seats(planId, 0, 1), policy.branches(planId, 0, 1)].find(
    (decision) => !decision.allowed
  );
  if (quotaBlocking) {
    res.status(409).json({
      error: quotaBlocking.reason,
      ruleId: quotaBlocking.ruleId,
      scope: quotaBlocking.scope,
      mode: quotaBlocking.mode
    });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }
  const orgId = `org-${Date.now()}`;
  const branchId = `${orgId}-hq`;
  const userId = `u-${Date.now()}`;
  const slug = (parsed.data.agency || 'agency')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) + '-' + Date.now().toString().slice(-4);
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const org = await prisma.organization.create({
    data: {
      id: orgId,
      name: parsed.data.agency || `${parsed.data.name}'s Agency`,
      slug,
      ownerName: parsed.data.name || 'Agency Owner',
      email,
      phone: '',
      headquarters: 'Pakistan',
      plan: planId,
      status: 'PENDING',
      mrrPKR: planEntry.price,
      renewalDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      createdDate: new Date().toISOString().slice(0, 10),
      defaultCurrency: 'PKR',
      defaultTimezone: 'Asia/Karachi',
      currenciesJson: JSON.stringify([
        { code: 'PKR', symbol: '₨', rateToPKR: 1.0, isDefault: true }
      ]),
      branches: {
        create: {
          id: branchId,
          name: 'Head Office',
          manager: parsed.data.name || 'Owner',
          phone: '',
          totalStaff: 1
        }
      },
      users: {
        create: {
          id: userId,
          name: parsed.data.name || 'Agency Owner',
          email,
          passwordHash,
          role: 'AGENCY_OWNER',
          branchId,
          avatar: initials(parsed.data.name || 'AO')
        }
      }
    },
    include: { users: true, branches: true }
  });
  const user = org.users[0];
  const authUser = {
    id: user.id,
    organizationId: org.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId
  };
  await writeAudit({
    user: authUser,
    action: 'ORG_PENDING_APPROVAL',
    target: org.id,
    details: `${org.name} registered on ${planId} — awaiting Super Admin approval`,
    ip: req.ip
  });
  res.status(201).json({
    pendingApproval: true,
    message:
      'Account created. Your workspace is awaiting Super Admin approval — sign-in unlocks as soon as the platform owner approves it.',
    ruleId: 'rule-org-approval',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      avatar: user.avatar
    },
    organization: serializeOrg(org)
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { organization: true, branch: true }
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.organization.status !== 'ACTIVE' && user.role !== 'SUPER_ADMIN') {
    const signInDecision = policy.signIn(user.organization);
    res.status(403).json({
      error: signInDecision.reason || 'This agency workspace is not active',
      ruleId: signInDecision.ruleId || 'rule-org-approval',
      scope: signInDecision.scope,
      mode: signInDecision.mode,
      status: user.organization.status
    });
    return;
  }
  if (user.role !== 'SUPER_ADMIN') {
    const roleDecision = policy.roleAccess(user.organization.plan, user.role);
    if (!roleDecision.allowed) {
      res.status(403).json({
        error: roleDecision.reason,
        ruleId: roleDecision.ruleId,
        scope: roleDecision.scope,
        mode: roleDecision.mode
      });
      return;
    }
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      avatar: user.avatar,
      phone: user.phone
    },
    organization: serializeOrg(user.organization)
  });
});

export function serializeOrg(org: {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  headquarters: string;
  plan: string;
  status: string;
  branchesCount: number;
  usersCount: number;
  activeCasesCount: number;
  mrrPKR: number;
  renewalDate: string;
  storageUsedMB: number;
  dtsLicense: string | null;
  createdDate: string;
  tagline: string | null;
  licenseNumber: string | null;
  whatsapp: string | null;
  defaultCurrency: string;
  defaultTimezone: string;
  currenciesJson: string;
}) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    ownerName: org.ownerName,
    email: org.email,
    phone: org.phone,
    headquarters: org.headquarters,
    plan: org.plan,
    status: org.status,
    branchesCount: org.branchesCount,
    usersCount: org.usersCount,
    activeCasesCount: org.activeCasesCount,
    mrrPKR: org.mrrPKR,
    renewalDate: org.renewalDate,
    storageUsedMB: org.storageUsedMB,
    dtsLicense: org.dtsLicense,
    createdDate: org.createdDate,
    tagline: org.tagline,
    licenseNumber: org.licenseNumber,
    whatsapp: org.whatsapp,
    defaultCurrency: org.defaultCurrency,
    defaultTimezone: org.defaultTimezone,
    currencies: JSON.parse(org.currenciesJson || '[]')
  };
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export { env };
