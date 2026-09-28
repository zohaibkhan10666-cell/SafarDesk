import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES } from './rbac.js';
import { prisma } from './prisma.js';

/**
 * Platform configuration + policy engine (README §19).
 *
 * The Super Admin (SaaS Owner) authors these rules once. Every organization,
 * user, branch, role and subscription plan is evaluated against them by the
 * API — tenants can consume the configuration, never override it.
 */

export type EnforcementMode = 'HARD_BLOCK' | 'SOFT_WARN' | 'OFF';
export type RuleScope = 'PLAN' | 'ORGANIZATION' | 'USER' | 'BRANCH' | 'ROLE' | 'FEATURE';

export type PlatformRule = {
  id: string;
  scope: RuleScope;
  domain: string;
  title: string;
  description: string;
  value: string;
  mode: EnforcementMode;
  applies: string;
};

export type FeatureFlag = {
  id: string;
  label: string;
  description: string;
  plans: string[];
  enabled: boolean;
};

export type PlanQuota = { seats: number; branches: number; storageMB: number };

export type Decision = {
  allowed: boolean;
  flagged?: boolean;
  ruleId?: string;
  scope?: RuleScope;
  mode?: EnforcementMode;
  reason?: string;
};

export const ENFORCEMENT_MODES: EnforcementMode[] = ['HARD_BLOCK', 'SOFT_WARN', 'OFF'];

/** Quotas the engine grants to every buyer of a plan (plan catalog). */
export const PLAN_QUOTAS: Record<string, PlanQuota> = {
  STARTER: { seats: 4, branches: 1, storageMB: 1024 },
  BUSINESS: { seats: 10, branches: 3, storageMB: 5 * 1024 },
  AGENCY_PRO: { seats: 25, branches: 10, storageMB: 20 * 1024 }
};

const DEFAULT_RULES: PlatformRule[] = [
  { id: 'rule-plan-seats', scope: 'PLAN', domain: 'Subscription Plan Catalog', title: 'Seat quota per plan', description: 'Maximum users a tenant may invite. New seats above the quota are rejected.', value: 'Starter 4 · Business 10 · Enterprise Pro 25', mode: 'HARD_BLOCK', applies: '4 tenants' },
  { id: 'rule-plan-branches', scope: 'PLAN', domain: 'Subscription Plan Catalog', title: 'Branch quota per plan', description: 'Maximum branches a tenant may provision.', value: 'Starter 1 · Business 3 · Enterprise Pro 10', mode: 'HARD_BLOCK', applies: '4 tenants' },
  { id: 'rule-plan-storage', scope: 'PLAN', domain: 'Subscription Plan Catalog', title: 'Vault storage quota', description: 'Document vault ceiling per tenant. Uploads beyond quota are rejected.', value: 'Starter 1 GB · Business 5 GB · Enterprise Pro 20 GB', mode: 'HARD_BLOCK', applies: '4 tenants' },
  { id: 'rule-plan-renewal', scope: 'PLAN', domain: 'Subscription Plan Catalog', title: 'Renewal grace window', description: 'Days a past-due tenant keeps access before suspension.', value: '7 days grace, then automatic suspension', mode: 'SOFT_WARN', applies: '4 tenants' },
  { id: 'rule-plan-role-access', scope: 'PLAN', domain: 'Subscription Plan Catalog', title: 'Role access per plan', description: 'Each plan declares which role categories a tenant may use. Sign-in, registration and plan changes reject roles outside that allow-list.', value: 'Starter 4 roles · Business 7 roles · Enterprise Pro 9 roles', mode: 'HARD_BLOCK', applies: '4 tenants' },
  { id: 'rule-org-approval', scope: 'ORGANIZATION', domain: 'Organization Policy', title: 'Super Admin approval gate', description: 'Self-registered tenants are created as PENDING. Sign-in and workspace access stay locked until the platform owner approves the workspace.', value: 'New sign-ups start PENDING · approved to ACTIVE from the console', mode: 'HARD_BLOCK', applies: '4 tenants' },
  { id: 'rule-org-suspension', scope: 'ORGANIZATION', domain: 'Organization Policy', title: 'Suspended tenant lock', description: 'A suspended organization loses all write access platform-wide.', value: 'All writes blocked while status = SUSPENDED', mode: 'HARD_BLOCK', applies: '4 tenants' },
  { id: 'rule-org-dts', scope: 'ORGANIZATION', domain: 'Organization Policy', title: 'DTS accreditation required', description: 'Every agency tenant must carry a valid DTS licence on file.', value: 'Mandatory before first provisioning', mode: 'SOFT_WARN', applies: '4 tenants' },
  { id: 'rule-org-defaults', scope: 'ORGANIZATION', domain: 'Organization Policy', title: 'Platform currency & timezone defaults', description: 'Tenants inherit PKR / Asia-Karachi unless the platform config changes it.', value: 'PKR · Asia/Karachi · tenant override rejected', mode: 'HARD_BLOCK', applies: '4 tenants' },
  { id: 'rule-user-seat', scope: 'USER', domain: 'User & Seat Policy', title: 'Seat cap equals plan seats', description: 'User creation and invitations stop at the plan seat limit.', value: 'Enforced on invite + register', mode: 'HARD_BLOCK', applies: 'all users' },
  { id: 'rule-user-mfa', scope: 'USER', domain: 'User & Seat Policy', title: 'MFA for owner & finance roles', description: 'Agency owners and accountants must complete second-factor sign-in.', value: 'AGENCY_OWNER · ACCOUNTANT · SUPER_ADMIN', mode: 'HARD_BLOCK', applies: 'all users' },
  { id: 'rule-user-session', scope: 'USER', domain: 'User & Seat Policy', title: 'Session TTL', description: 'Platform session lifetime; expired tokens are rejected automatically.', value: '12 hours idle · 7 days absolute', mode: 'HARD_BLOCK', applies: 'all users' },
  { id: 'rule-user-password', scope: 'USER', domain: 'User & Seat Policy', title: 'Password policy', description: 'Minimum length and complexity for every role in every tenant.', value: '12 chars · upper + lower + number', mode: 'HARD_BLOCK', applies: 'all users' },
  { id: 'rule-branch-cap', scope: 'BRANCH', domain: 'Branch Policy', title: 'Branch cap equals plan branches', description: 'Creating a branch beyond the plan quota is rejected by the system.', value: 'Checked on branch create', mode: 'HARD_BLOCK', applies: 'all branches' },
  { id: 'rule-branch-manager', scope: 'BRANCH', domain: 'Branch Policy', title: 'Branch manager assignment', description: 'Every branch must have an assigned manager before it accepts work.', value: 'Manager required within 48h of creation', mode: 'SOFT_WARN', applies: 'all branches' },
  { id: 'rule-role-catalog', scope: 'ROLE', domain: 'Role & Permission Policy', title: 'Fixed platform role catalog', description: 'Tenants may only assign roles defined by the platform — no custom shadow roles.', value: `${ROLES.length} roles · ${ROLES[0]} … ${ROLES[ROLES.length - 1]}`, mode: 'HARD_BLOCK', applies: `${ROLES.length} roles` },
  { id: 'rule-role-modules', scope: 'ROLE', domain: 'Role & Permission Policy', title: 'Module access matrix', description: 'Each role sees only the modules README §15 allows, in every tenant.', value: 'Dashboard · CRM · Visa · Finance · Reports · Settings', mode: 'HARD_BLOCK', applies: `${ROLES.length} roles` },
  { id: 'rule-role-finance', scope: 'ROLE', domain: 'Role & Permission Policy', title: 'Finance write lock', description: 'finance.write stays with ACCOUNTANT / AGENCY_OWNER / SUPER_ADMIN only.', value: '3 of 10 roles hold finance.write', mode: 'HARD_BLOCK', applies: `${ROLES.length} roles` },
  { id: 'rule-role-platform', scope: 'ROLE', domain: 'Role & Permission Policy', title: 'Platform admin isolation', description: 'platform.admin exists for SUPER_ADMIN only and cannot be granted inside a tenant.', value: '1 of 10 roles holds platform.admin', mode: 'HARD_BLOCK', applies: '1 role' },
  { id: 'rule-flags-entitlement', scope: 'FEATURE', domain: 'Feature Flags', title: 'Plan feature entitlement', description: 'Modules outside the buyer’s plan stay locked regardless of tenant settings.', value: 'Flag checked on every module request', mode: 'HARD_BLOCK', applies: '4 tenants' }
];

const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: 'flag-whatsapp', label: 'WhatsApp communication hub', description: 'Broadcast + agency support inbox', plans: ['STARTER', 'BUSINESS', 'AGENCY_PRO'], enabled: true },
  { id: 'flag-advanced-reports', label: 'Advanced analytics & reports', description: 'Finance, branch and consultant performance', plans: ['BUSINESS', 'AGENCY_PRO'], enabled: true },
  { id: 'flag-api-access', label: 'Public API & webhooks', description: 'Outbound integrations for GDS and CRM', plans: ['AGENCY_PRO'], enabled: true },
  { id: 'flag-audit-export', label: 'Audit log export (CSV)', description: 'Platform audit stream export', plans: ['AGENCY_PRO'], enabled: true },
  { id: 'flag-multi-branch', label: 'Multi-branch workspace', description: 'Branch switching and branch-scoped RBAC', plans: ['BUSINESS', 'AGENCY_PRO'], enabled: true },
  { id: 'flag-sandbox', label: 'Sandbox / trial mode', description: 'Full-feature evaluation tenant for prospects', plans: ['STARTER', 'BUSINESS', 'AGENCY_PRO'], enabled: false }
];

const CONFIG_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'platform-config.json');

let rules: PlatformRule[] = structuredClone(DEFAULT_RULES);
let featureFlags: FeatureFlag[] = structuredClone(DEFAULT_FLAGS);
let updatedAt = new Date().toISOString();

function loadPersistedConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { rules?: PlatformRule[]; featureFlags?: FeatureFlag[]; updatedAt?: string };
    if (Array.isArray(parsed.rules)) {
      const persisted = new Map(parsed.rules.map((rule) => [rule.id, rule]));
      rules = DEFAULT_RULES.map((rule) => ({ ...rule, ...(persisted.get(rule.id) || {}) }));
    }
    if (Array.isArray(parsed.featureFlags)) {
      const persisted = new Map(parsed.featureFlags.map((flag) => [flag.id, flag]));
      featureFlags = DEFAULT_FLAGS.map((flag) => ({ ...flag, ...(persisted.get(flag.id) || {}) }));
    }
    if (parsed.updatedAt) updatedAt = parsed.updatedAt;
  } catch {
    // First boot or unreadable file — fall back to the platform defaults.
  }
}

function persistConfig() {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, `${JSON.stringify({ rules, featureFlags, updatedAt }, null, 2)}\n`, 'utf8');
  } catch {
    // Persistence is best-effort; the engine keeps working from memory.
  }
}

loadPersistedConfig();

/* ------------------------------------------------------------------ */
/* Plan catalog (README §19.1 · domain 1)                              */
/* The Super Admin edits plans in the console; the database is the     */
/* single source of truth for price, quotas and the per-plan role      */
/* allow-list. Refreshed at boot and after every plan write.           */
/* ------------------------------------------------------------------ */

export type PlanCatalogEntry = {
  id: string;
  name: string;
  price: number;
  seats: number;
  branches: number;
  storageGB: number;
  storageMB: number;
  features: string;
  description: string;
  allowedRoles: string[];
  sortOrder: number;
  active: boolean;
};

/** Role categories every tenant can use when a plan carries no allow-list yet. */
export const TENANT_ROLES: string[] = ROLES.filter((role) => role !== 'SUPER_ADMIN');

let planCatalog = new Map<string, PlanCatalogEntry>();

function parseAllowedRoles(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) {
      return parsed.filter((role): role is string => typeof role === 'string' && (ROLES as readonly string[]).includes(role));
    }
  } catch {
    // Unreadable allow-list — the caller falls back to TENANT_ROLES.
  }
  return [];
}

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

function toCatalogEntry(row: PlanRow): PlanCatalogEntry {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    seats: row.roles,
    branches: row.branches,
    storageGB: row.storageGB,
    storageMB: row.storageGB * 1024,
    features: row.features,
    description: row.description,
    allowedRoles: parseAllowedRoles(row.allowedRoles),
    sortOrder: row.sortOrder,
    active: row.isActive
  };
}

const PLAN_LABEL: Record<string, string> = { STARTER: 'Starter', BUSINESS: 'Business', AGENCY_PRO: 'Enterprise Pro' };

function planLabel(entry: PlanCatalogEntry): string {
  return PLAN_LABEL[entry.id] || entry.name;
}

/** Keeps the PLAN / ORGANIZATION rule text in sync with what is actually saved. */
function syncRuleText(entries: PlanCatalogEntry[], tenantCount: number) {
  if (!entries.length) return;
  const apply = (id: string, value: string, applies?: string) => {
    const rule = rules.find((entry) => entry.id === id);
    if (!rule) return;
    if (value && rule.value !== value) rule.value = value;
    if (applies !== undefined && rule.applies !== applies) rule.applies = applies;
  };
  const tenants = `${tenantCount} tenants`;
  apply('rule-plan-seats', entries.map((entry) => `${planLabel(entry)} ${entry.seats}`).join(' · '), tenants);
  apply('rule-plan-branches', entries.map((entry) => `${planLabel(entry)} ${entry.branches}`).join(' · '), tenants);
  apply('rule-plan-storage', entries.map((entry) => `${planLabel(entry)} ${entry.storageGB} GB`).join(' · '), tenants);
  apply(
    'rule-plan-role-access',
    entries.map((entry) => `${planLabel(entry)} ${entry.allowedRoles.length || TENANT_ROLES.length} roles`).join(' · '),
    tenants
  );
}

/** Reloads the plan catalog from the database (never throws). */
export async function refreshPlanCatalog(): Promise<PlanCatalogEntry[]> {
  try {
    const [rows, tenantCount] = await Promise.all([prisma.plan.findMany(), prisma.organization.count()]);
    const next = new Map<string, PlanCatalogEntry>();
    for (const row of rows) next.set(row.id, toCatalogEntry(row as PlanRow));
    planCatalog = next;
    syncRuleText(listPlans(), tenantCount);
  } catch (error) {
    console.warn('[platform] plan catalog refresh failed:', (error as Error).message);
  }
  return listPlans();
}

export function listPlans(): PlanCatalogEntry[] {
  return [...planCatalog.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.price - b.price || a.name.localeCompare(b.name)
  );
}

export function getPlan(planId: string | null | undefined): PlanCatalogEntry | null {
  if (!planId) return null;
  return planCatalog.get(planId) ?? null;
}

/** Unknown plan → inactive. An empty catalog falls back to the built-in tiers. */
export function planIsActive(planId: string | null | undefined): boolean {
  const entry = getPlan(planId);
  if (entry) return entry.active;
  return PLAN_QUOTAS[planId || ''] !== undefined;
}

export function allowedRolesFor(planId: string): string[] {
  const entry = getPlan(planId);
  if (!entry || entry.allowedRoles.length === 0) return [...TENANT_ROLES];
  return [...entry.allowedRoles];
}

export function quotasSnapshot(): Record<string, PlanQuota> {
  const snapshot: Record<string, PlanQuota> = { ...PLAN_QUOTAS };
  for (const entry of listPlans()) {
    snapshot[entry.id] = { seats: entry.seats, branches: entry.branches, storageMB: entry.storageMB };
  }
  return snapshot;
}

/**
 * Modules a plan unlocks (README §19.1 · rule-flags-entitlement).
 * Tenants see the intersection of their role's modules and their plan's modules.
 * SUPER_ADMIN always reaches the platform console regardless of plan.
 */
const BASE_MODULES = [
  'dashboard',
  'cases',
  'portal',
  'leads',
  'tasks',
  'customers',
  'quotations',
  'packages',
  'bookings',
  'reports',
  'settings'
];

const PLAN_MODULES: Record<string, string[]> = {
  STARTER: [...BASE_MODULES],
  BUSINESS: [...BASE_MODULES, 'visa', 'vault', 'finance', 'suppliers'],
  AGENCY_PRO: [...BASE_MODULES, 'visa', 'vault', 'suppliers', 'finance', 'subagent']
};

export function modulesForPlan(planId: string | null | undefined): string[] {
  return [...(PLAN_MODULES[planId || ''] || PLAN_MODULES.STARTER)];
}

export function getRules(): PlatformRule[] {
  return rules;
}

export function getFeatureFlags(): FeatureFlag[] {
  return featureFlags;
}

export function quotaFor(plan: string): PlanQuota {
  const entry = getPlan(plan);
  if (entry) return { seats: entry.seats, branches: entry.branches, storageMB: entry.storageMB };
  return PLAN_QUOTAS[plan] || PLAN_QUOTAS.STARTER;
}

/** Feature-flag entitlement for a plan (README §19.1 · domain 6). */
export function flagEnabled(flagId: string, plan: string): boolean {
  const flag = featureFlags.find((entry) => entry.id === flagId);
  if (!flag || !flag.enabled) return false;
  return flag.plans.includes(plan);
}

export function getPlatformConfig() {
  const active = rules.filter((rule) => rule.mode !== 'OFF');
  return {
    rules,
    featureFlags,
    quotas: quotasSnapshot(),
    summary: {
      totalRules: rules.length,
      activeRules: active.length,
      hardBlocks: rules.filter((rule) => rule.mode === 'HARD_BLOCK').length,
      softWarnings: rules.filter((rule) => rule.mode === 'SOFT_WARN').length,
      paused: rules.length - active.length
    },
    updatedAt
  };
}

export function updateRule(id: string, patch: { mode?: string; value?: string }): PlatformRule {
  const rule = rules.find((entry) => entry.id === id);
  if (!rule) throw new Error('Unknown configuration rule');
  if (patch.mode !== undefined) {
    if (!ENFORCEMENT_MODES.includes(patch.mode as EnforcementMode)) {
      throw new Error(`Invalid enforcement mode. Expected ${ENFORCEMENT_MODES.join(' | ')}`);
    }
    rule.mode = patch.mode as EnforcementMode;
  }
  if (patch.value !== undefined) rule.value = String(patch.value).slice(0, 300);
  updatedAt = new Date().toISOString();
  persistConfig();
  return rule;
}

export function setFeatureFlag(id: string, enabled: boolean): FeatureFlag {
  const flag = featureFlags.find((entry) => entry.id === id);
  if (!flag) throw new Error('Unknown feature flag');
  flag.enabled = Boolean(enabled);
  updatedAt = new Date().toISOString();
  persistConfig();
  return flag;
}

const ALLOW: Decision = { allowed: true };

/** Evaluate a condition against its platform rule and enforcement mode. */
export function evaluate(ruleId: string, conditionOk: boolean, reason: string): Decision {
  const rule = rules.find((entry) => entry.id === ruleId);
  if (!rule || rule.mode === 'OFF') return ALLOW;
  if (conditionOk) return ALLOW;
  if (rule.mode === 'SOFT_WARN') {
    return { allowed: true, flagged: true, ruleId, scope: rule.scope, mode: rule.mode, reason };
  }
  return { allowed: false, ruleId, scope: rule.scope, mode: rule.mode, reason };
}

export const policy = {
  tenantWritable(org: { status: string }): Decision {
    return evaluate(
      'rule-org-suspension',
      org.status === 'ACTIVE',
      'This agency workspace is suspended by the platform. Reactivate the tenant to allow writes.'
    );
  },
  /** Sign-in gate: PENDING tenants await Super Admin approval, everything else needs ACTIVE. */
  signIn(org: { status: string }): Decision {
    if (org.status === 'PENDING') {
      return evaluate(
        'rule-org-approval',
        false,
        'This workspace is awaiting Super Admin approval. Sign-in unlocks once the platform owner approves it.'
      );
    }
    return evaluate(
      'rule-org-suspension',
      org.status === 'ACTIVE',
      'This agency workspace is not active. Reactivate the tenant before signing in.'
    );
  },
  seats(plan: string, currentSeats: number, additionalSeats = 0): Decision {
    const quota = quotaFor(plan);
    return evaluate(
      'rule-plan-seats',
      currentSeats + additionalSeats <= quota.seats,
      `Plan ${plan} allows ${quota.seats} seats — ${currentSeats} in use. Upgrade the plan to add more.`
    );
  },
  branches(plan: string, currentBranches: number, additionalBranches = 0): Decision {
    const quota = quotaFor(plan);
    return evaluate(
      'rule-plan-branches',
      currentBranches + additionalBranches <= quota.branches,
      `Plan ${plan} allows ${quota.branches} branches — ${currentBranches} in use. Upgrade the plan to add more.`
    );
  },
  storage(plan: string, currentMB: number, incomingMB = 0): Decision {
    const quota = quotaFor(plan);
    return evaluate(
      'rule-plan-storage',
      currentMB + incomingMB <= quota.storageMB,
      `Plan ${plan} vault quota is ${Math.round(quota.storageMB / 1024)} GB — ${Math.round(currentMB / 1024)} GB already used.`
    );
  },
  role(role: string): Decision {
    return evaluate('rule-role-catalog', (ROLES as readonly string[]).includes(role), `Role "${role}" is not part of the platform role catalog.`);
  },
  /** Is this role category entitled on this plan? (README §19.1 · domain 1 + 5) */
  roleAccess(plan: string, role: string | null | undefined): Decision {
    if (!role) return ALLOW;
    const allowed = allowedRolesFor(plan);
    return evaluate(
      'rule-plan-role-access',
      allowed.includes(role),
      `Plan ${plan} does not grant the "${role}" role — enable it in Platform Configuration → Subscription Plan Catalog.`
    );
  },
  dtsPresent(dtsLicense: string | null | undefined): Decision {
    return evaluate('rule-org-dts', Boolean(dtsLicense), 'Agency has no DTS accreditation on file.');
  }
};

export type TenantCompliance = {
  id: string;
  name: string;
  plan: string;
  status: 'COMPLIANT' | 'AT RISK' | 'OVER LIMIT' | 'LOCKED';
  blockedWrites: boolean;
  checks: Array<{ key: string; label: string; used: number; limit: number; ok: boolean; pct: number }>;
};

export function complianceFor(org: {
  id: string;
  name: string;
  plan: string;
  status: string;
  usersCount: number;
  branchesCount: number;
  storageUsedMB: number;
}): TenantCompliance {
  const quota = quotaFor(org.plan);
  const checks = [
    { key: 'seats', label: 'Seats', used: org.usersCount, limit: quota.seats },
    { key: 'branches', label: 'Branches', used: org.branchesCount, limit: quota.branches },
    { key: 'storage', label: 'Vault storage', used: org.storageUsedMB, limit: quota.storageMB }
  ].map((check) => ({
    ...check,
    ok: check.used <= check.limit,
    pct: check.limit > 0 ? Math.min(100, Math.round((check.used / check.limit) * 100)) : 0
  }));

  const locked = org.status !== 'ACTIVE';
  const over = checks.some((check) => !check.ok);
  const near = checks.some((check) => check.pct >= 85);

  return {
    id: org.id,
    name: org.name,
    plan: org.plan,
    status: locked ? 'LOCKED' : over ? 'OVER LIMIT' : near ? 'AT RISK' : 'COMPLIANT',
    blockedWrites: locked,
    checks
  };
}
