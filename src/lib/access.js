/**
 * Role × plan access matrix (README §15 · §19.1).
 *
 * A tab is reachable when the signed-in role allows it AND the tenant's
 * subscription plan unlocks the module. SUPER_ADMIN bypasses plan gating
 * (it already bypasses tenant write locks on the API).
 */

export const ROLE_TABS = {
  SUPER_ADMIN: ['superadmin', 'reports', 'settings'],
  TRAVEL_CONSULTANT: ['dashboard', 'cases', 'leads', 'customers', 'visa', 'quotations', 'packages', 'bookings', 'tasks', 'vault'],
  VISA_OFFICER: ['dashboard', 'cases', 'visa', 'vault', 'tasks', 'reports'],
  ACCOUNTANT: ['dashboard', 'cases', 'finance', 'suppliers', 'tasks', 'reports'],
  OPERATIONS_STAFF: ['dashboard', 'cases', 'bookings', 'packages', 'vault', 'tasks'],
  BRANCH_MANAGER: ['dashboard', 'cases', 'leads', 'customers', 'visa', 'bookings', 'tasks', 'reports'],
  SUB_AGENT: ['subagent', 'packages', 'portal'],
  CUSTOMER: ['portal'],
  // AGENCY_OWNER, AGENCY_MANAGER: full access
  AGENCY_OWNER: ['dashboard', 'cases', 'portal', 'leads', 'tasks', 'customers', 'visa', 'vault', 'quotations', 'packages', 'bookings', 'finance', 'suppliers', 'reports', 'settings'],
  AGENCY_MANAGER: ['dashboard', 'cases', 'portal', 'leads', 'tasks', 'customers', 'visa', 'vault', 'quotations', 'packages', 'bookings', 'finance', 'suppliers', 'reports', 'settings']
};

const BASE_MODULES = ['dashboard', 'cases', 'portal', 'leads', 'tasks', 'customers', 'quotations', 'packages', 'bookings', 'reports', 'settings'];

/** Mirrors modulesForPlan() in server/src/platformConfig.ts. */
export const PLAN_MODULES = {
  STARTER: [...BASE_MODULES],
  BUSINESS: [...BASE_MODULES, 'visa', 'vault', 'finance', 'suppliers'],
  AGENCY_PRO: [...BASE_MODULES, 'visa', 'vault', 'finance', 'suppliers', 'subagent']
};

export function modulesForPlan(planId) {
  return [...(PLAN_MODULES[planId] || PLAN_MODULES.STARTER)];
}

/** Tabs this role may use before plan gating. */
export function roleTabs(role) {
  return ROLE_TABS[role] || ROLE_TABS.AGENCY_OWNER;
}

/**
 * @param {string} role signed-in role id
 * @param {string[]|null} modules plan modules from GET /api/v1/entitlements
 * @param {string|null} planId plan id, used to derive a fallback module list
 *   when entitlements could not be loaded (no plan knowledge → no plan gating)
 */
export function allowedTabsFor(role, modules, planId = null) {
  const tabs = roleTabs(role);
  if (role === 'SUPER_ADMIN') return [...tabs];
  const planModules = resolveModules(modules, planId);
  if (!planModules) return [...tabs];
  return tabs.filter((tab) => planModules.includes(tab));
}

/** Role tabs the plan keeps locked (shown muted in the sidebar). */
export function planLockedTabs(role, modules, planId = null) {
  const tabs = roleTabs(role);
  if (role === 'SUPER_ADMIN') return [];
  const planModules = resolveModules(modules, planId);
  if (!planModules) return [];
  return tabs.filter((tab) => !planModules.includes(tab));
}

function resolveModules(modules, planId) {
  if (Array.isArray(modules) && modules.length) return modules;
  if (planId) return modulesForPlan(planId);
  return null;
}
