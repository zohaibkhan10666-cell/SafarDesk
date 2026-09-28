import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Extended smoke: plan catalog CRUD + role access + §19 enforcement wiring.
const BASE = 'http://localhost:4000/api/v1';
const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0;
let fail = 0;
const failures = [];

async function call(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, ok: res.ok, data };
}

function check(label, condition, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  ok   ${label}`);
  } else {
    fail += 1;
    failures.push(`${label} ${detail}`);
    console.log(`  FAIL ${label} ${detail}`);
  }
}

const login = await call('POST', '/auth/login', { email: 'nina.v@example.com', password: 'SafarDesk@2026' });
check('super admin login', login.ok, JSON.stringify(login.data).slice(0, 160));
const token = login.data.token;
if (!token) {
  console.log('cannot continue without token');
  process.exit(1);
}

console.log('\n[1] plan catalog');
const plans0 = await call('GET', '/platform/plans', undefined, token);
check('GET /platform/plans 200', plans0.ok);
check('3 seeded plans', plans0.data.plans?.length === 3, `got ${plans0.data.plans?.length}`);
const starter = plans0.data.plans?.find((p) => p.id === 'STARTER');
check('plan rows carry allowedRoles', Array.isArray(starter?.allowedRoles) && starter.allowedRoles.length === 4, JSON.stringify(starter?.allowedRoles));
check('plan rows carry storageGB', starter?.storageGB === 1);
check('plan rows carry isActive', starter?.isActive === true);
check('plan rows carry buyer counts', starter?.buyers === 1 && plans0.data.plans?.find((p) => p.id === 'AGENCY_PRO')?.buyers === 1, JSON.stringify(plans0.data.plans?.map((p) => [p.id, p.buyers])));

console.log('\n[2] plan create');
const created = await call(
  'POST',
  '/platform/plans',
  {
    id: 'TEST_PLAN',
    name: 'Test Tier',
    price: 1000,
    roles: 99,
    branches: 99,
    storageGB: 999,
    features: 'Test features',
    description: 'Temporary plan',
    allowedRoles: ['AGENCY_OWNER'],
    sortOrder: 9
  },
  token
);
check('POST /platform/plans 201', created.status === 201, JSON.stringify(created.data).slice(0, 200));
check('created plan visible', created.data.plans?.some((p) => p.id === 'TEST_PLAN'));
check('role allow-list stored', created.data.plans?.find((p) => p.id === 'TEST_PLAN')?.allowedRoles?.join(',') === 'AGENCY_OWNER');

const duplicate = await call('POST', '/platform/plans', { id: 'TEST_PLAN', name: 'Dup', price: 1, roles: 1, branches: 1, storageGB: 1, features: 'x', allowedRoles: ['AGENCY_OWNER'] }, token);
check('duplicate plan code rejected 409', duplicate.status === 409, `got ${duplicate.status}`);

const noOwner = await call('POST', '/platform/plans', { id: 'NO_OWNER', name: 'No Owner', price: 1, roles: 1, branches: 1, storageGB: 1, features: 'x', allowedRoles: ['ACCOUNTANT'] }, token);
check('plan without AGENCY_OWNER accepted (super admin chooses the roles)', noOwner.status === 201, `got ${noOwner.status} ${JSON.stringify(noOwner.data).slice(0, 180)}`);
// remove the temporary tier again so the active catalog still reports the 3 seeded plans
await call('DELETE', '/platform/plans/NO_OWNER', undefined, token);

const badRole = await call('POST', '/platform/plans', { id: 'BAD_ROLE', name: 'Bad', price: 1, roles: 1, branches: 1, storageGB: 1, features: 'x', allowedRoles: ['NOPE'] }, token);
check('unknown role rejected', badRole.status === 400 && badRole.data.ruleId === 'rule-role-catalog', `got ${badRole.status}`);

console.log('\n[3] config reflects the catalog');
const cfg = await call('GET', '/platform/config', undefined, token);
check('config 200', cfg.ok);
check('rule-plan-role-access exists', cfg.data.rules?.some((r) => r.id === 'rule-plan-role-access'));
check('quotas include new plan', cfg.data.quotas?.TEST_PLAN?.seats === 99, JSON.stringify(cfg.data.quotas));
check('seat rule value follows the catalog', /Starter/.test(cfg.data.rules?.find((r) => r.id === 'rule-plan-seats')?.value || ''), cfg.data.rules?.find((r) => r.id === 'rule-plan-seats')?.value);

console.log('\n[4] role access enforcement');
const orgs0 = await call('GET', '/platform/organizations', undefined, token);
const org1 = orgs0.data.organizations?.find((o) => o.id === 'org-1');
const org2 = orgs0.data.organizations?.find((o) => o.id === 'org-2');
const org3 = orgs0.data.organizations?.find((o) => o.id === 'org-3');
check('seeded orgs present', Boolean(org1 && org2 && org3));

const badDowngrade = await call('PATCH', '/platform/organizations/org-1', { plan: 'TEST_PLAN' }, token);
check('plan change blocked when roles not entitled', badDowngrade.status === 409 && badDowngrade.data.ruleId === 'rule-plan-role-access', `got ${badDowngrade.status} ${JSON.stringify(badDowngrade.data)}`);
check('blocked roles listed', Array.isArray(badDowngrade.data.roles) && badDowngrade.data.roles.length > 0, JSON.stringify(badDowngrade.data.roles));

const okDowngrade = await call('PATCH', '/platform/organizations/org-2', { plan: 'TEST_PLAN' }, token);
check('matching plan change allowed', okDowngrade.ok && okDowngrade.data.plan === 'TEST_PLAN', JSON.stringify(okDowngrade.data).slice(0, 200));
check('MRR follows the new plan', okDowngrade.data.mrrPKR === 1000, `mrr=${okDowngrade.data.mrrPKR}`);

const restore = await call('PATCH', '/platform/organizations/org-2', { plan: 'BUSINESS' }, token);
check('org-2 restored to BUSINESS', restore.ok && restore.data.mrrPKR === 42000, JSON.stringify([restore.status, restore.data.mrrPKR]));

console.log('\n[5] seat / quota enforcement on plan change');
const seatBlock = await call('PATCH', '/platform/organizations/org-1', { plan: 'STARTER' }, token);
check('downgrade blocked by seat quota', seatBlock.status === 409 && seatBlock.data.ruleId === 'rule-plan-seats', `got ${seatBlock.status} ${JSON.stringify(seatBlock.data).slice(0, 200)}`);

console.log('\n[6] price edit rewrites buyer MRR');
const pricePatch = await call('PATCH', '/platform/plans/STARTER', { price: 19500 }, token);
check('PATCH /platform/plans/STARTER 200', pricePatch.ok, JSON.stringify(pricePatch.data).slice(0, 200));
const orgs1 = await call('GET', '/platform/organizations', undefined, token);
const starterBuyer = orgs1.data.organizations?.find((o) => o.plan === 'STARTER');
check('buyer MRR updated to new price', starterBuyer?.mrrPKR === 19500, `mrr=${starterBuyer?.mrrPKR}`);
const restorePrice = await call('PATCH', '/platform/plans/STARTER', { price: 18000 }, token);
check('price restored', restorePrice.ok);

console.log('\n[7] plan retire guard');
const usedDelete = await call('DELETE', '/platform/plans/STARTER', undefined, token);
check('plan with buyers cannot be deleted', usedDelete.status === 409 && usedDelete.data.buyers === 1, `got ${usedDelete.status}`);
const freeDelete = await call('DELETE', '/platform/plans/TEST_PLAN', undefined, token);
check('plan without buyers deletes', freeDelete.ok && !freeDelete.data.plans?.some((p) => p.id === 'TEST_PLAN'), JSON.stringify(freeDelete.data).slice(0, 160));

console.log('\n[8] role analytics + audit stream');
const roles = await call('GET', '/platform/roles', undefined, token);
check('GET /platform/roles 200', roles.ok);
check('10 platform roles', roles.data.roles?.length === 10, `got ${roles.data.roles?.length}`);
check('AGENCY_OWNER has real holders', (roles.data.roles?.find((r) => r.role === 'AGENCY_OWNER')?.users ?? 0) > 0, JSON.stringify(roles.data.roles?.find((r) => r.role === 'AGENCY_OWNER')));
const audit = await call('GET', '/platform/audit', undefined, token);
check('GET /platform/audit 200', audit.ok);
check('plan events in the audit stream', audit.data.logs?.some((l) => l.action === 'PLATFORM_PLAN_CREATED'), JSON.stringify(audit.data.logs?.slice(0, 4).map((l) => l.action)));
check('enforcement blocks audited', audit.data.logs?.some((l) => l.action === 'PLATFORM_ENFORCEMENT_BLOCK'));

console.log('\n[9] enforcement report');
const en = await call('GET', '/platform/enforcement', undefined, token);
check('enforcement 200', en.ok);
check('compliance summary present', typeof en.data.summary?.complianceRate === 'number', JSON.stringify(en.data.summary));

console.log('\n[10] tenant entitlements');
const tenant = await call('POST', '/auth/login', { email: 'junaid@karakoramexpress.pk', password: 'SafarDesk@2026' });
check('tenant login', tenant.ok, JSON.stringify(tenant.data).slice(0, 160));
const ent = await call('GET', '/entitlements', undefined, tenant.data.token);
check('GET /entitlements 200', ent.ok);
check('plan reported', ent.data.plan?.id === 'BUSINESS', JSON.stringify(ent.data.plan));
check('allowed roles reported', Array.isArray(ent.data.allowedRoles) && ent.data.allowedRoles.length === 7, JSON.stringify(ent.data.allowedRoles));
check('role entitlement for owner allowed', ent.data.role?.allowed === true, JSON.stringify(ent.data.role));
check('flags carry per-plan entitlement', ent.data.flags?.some((f) => f.id === 'flag-api-access' && f.enabled === false) && ent.data.flags?.some((f) => f.id === 'flag-advanced-reports' && f.enabled === true), JSON.stringify(ent.data.flags?.map((f) => [f.id, f.enabled])));
check('active catalog exposed', ent.data.catalog?.length === 3 && ent.data.catalog?.every((p) => p.isActive !== false), JSON.stringify(ent.data.catalog?.map((p) => p.id)));

const samePlan = await call('POST', '/entitlements/plan-request', { planId: 'BUSINESS' }, tenant.data.token);
check('requesting current plan rejected', samePlan.status === 400, `got ${samePlan.status}`);
const upgrade = await call('POST', '/entitlements/plan-request', { planId: 'AGENCY_PRO' }, tenant.data.token);
check('upgrade request accepted', upgrade.ok && upgrade.data.ok === true, JSON.stringify(upgrade.data).slice(0, 200));

console.log('\n[11] registration rules');
const shortPassword = await call('POST', '/auth/register', { name: 'Short', agency: 'Short Agency', email: 'short-pw-test@example.com', password: 'short123', plan: 'STARTER' });
check('short password rejected (rule-user-password)', shortPassword.status === 400 && /12 characters/.test(shortPassword.data.error || ''), JSON.stringify(shortPassword.data));
const unknownPlan = await call('POST', '/auth/register', { name: 'No Plan', agency: 'No Plan Agency', email: 'no-plan-test@example.com', password: 'LongEnoughPass123', plan: 'GOLD_TIER' });
check('unknown plan rejected (rule-plan-seats)', unknownPlan.status === 400 && unknownPlan.data.ruleId === 'rule-plan-seats', JSON.stringify(unknownPlan.data));

console.log('\n[12] platform provisioning');
const badPlanProvision = await call('POST', '/platform/organizations', { name: 'Ghost Agency', ownerName: 'Ghost Owner', email: 'ghost@example.com', plan: 'GHOST' }, token);
check('provision with unknown plan rejected', badPlanProvision.status === 400 && badPlanProvision.data.ruleId === 'rule-plan-seats', JSON.stringify(badPlanProvision.data));
const provisioned = await call(
  'POST',
  '/platform/organizations',
  { name: 'Smoke Test Agency', ownerName: 'Smoke Owner', email: 'smoke-owner@example.com', phone: '+92 300 0000000', headquarters: 'Lahore, Punjab', dtsLicense: 'DTS-SMK-0001', plan: 'BUSINESS' },
  token
);
check('provision 201', provisioned.status === 201, JSON.stringify(provisioned.data).slice(0, 220));
check('provisioned org carries plan MRR', provisioned.data.mrrPKR === 42000, `mrr=${provisioned.data.mrrPKR}`);
check('provisioned org has owner user', provisioned.data.usersCount === 1 && provisioned.data.branchesCount === 1);

if (provisioned.data.id) {
  const cleanup = await call('POST', '/auth/login', { email: 'smoke-owner@example.com', password: 'SafarDesk@2026' });
  check('provisioned owner can sign in', cleanup.ok, JSON.stringify(cleanup.data).slice(0, 160));
}

console.log('\n[13] suspended tenant write lock (unchanged behaviour)');
const suspend = await call('PATCH', '/platform/organizations/org-3', { status: 'SUSPENDED' }, token);
check('suspend org-3', suspend.ok, JSON.stringify(suspend.data).slice(0, 120));
const resume = await call('PATCH', '/platform/organizations/org-3', { status: 'ACTIVE' }, token);
check('reactivate org-3', resume.ok, JSON.stringify(resume.data).slice(0, 120));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log('failures:');
  failures.forEach((item) => console.log(` - ${item}`));
  process.exitCode = 1;
} else {
  // The suite provisions a real tenant; undo it locally, push local rows to
  // Supabase and drop remote-only leftovers so parity holds after the run.
  console.log('\n[14] cleanup: remove provisioned tenant + reconcile Supabase');
  execSync('npx tsx scripts/remove-smoke-orgs.ts', { cwd: SERVER_DIR, stdio: 'inherit' });
  execSync('npx tsx scripts/reconcile-supabase.ts --apply', { cwd: SERVER_DIR, stdio: 'inherit' });
}
