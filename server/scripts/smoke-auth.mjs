import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Approval-gating smoke: signup → PENDING → sign-in blocked → Super Admin
// approves → sign-in + role/plan gated session → won lead becomes a customer.
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

const stamp = Date.now();
const email = `pending-owner-${stamp}@example.com`;
const password = 'PendingOwner2026';

const admin = await call('POST', '/auth/login', { email: 'nina.v@example.com', password: 'SafarDesk@2026' });
check('super admin login', admin.ok, JSON.stringify(admin.data).slice(0, 160));
const adminToken = admin.data.token;
if (!adminToken) {
  console.log('cannot continue without token');
  process.exit(1);
}

console.log('\n[1] self-signup creates a PENDING workspace');
const signup = await call('POST', '/auth/register', {
  name: 'Pending Owner',
  agency: 'Smoke Test Agency',
  email,
  password,
  plan: 'STARTER'
});
check('register 201', signup.status === 201, JSON.stringify(signup.data).slice(0, 220));
check('register does not hand out a session token', signup.data.token === undefined, `token=${signup.data.token}`);
check('register reports pendingApproval', signup.data.pendingApproval === true, JSON.stringify(signup.data));
check('created organization is PENDING', signup.data.organization?.status === 'PENDING', JSON.stringify(signup.data.organization?.status));
check('rule-org-approval referenced', signup.data.ruleId === 'rule-org-approval');
const orgId = signup.data.organization?.id;

console.log('\n[2] sign-in stays locked until approval');
const blocked = await call('POST', '/auth/login', { email, password });
check('pending workspace cannot sign in', blocked.status === 403, `got ${blocked.status} ${JSON.stringify(blocked.data).slice(0, 200)}`);
check('blocked with rule-org-approval', blocked.data.ruleId === 'rule-org-approval', JSON.stringify(blocked.data));
check('blocked response carries PENDING status', blocked.data.status === 'PENDING', JSON.stringify(blocked.data.status));

console.log('\n[3] Super Admin approves the workspace');
const orgs = await call('GET', '/platform/organizations', undefined, adminToken);
const pendingOrg = (orgs.data.organizations || []).find(o => o.id === orgId);
check('pending tenant listed in the console', Boolean(pendingOrg), `orgId=${orgId}`);
check('directory reports status PENDING', pendingOrg?.status === 'PENDING', JSON.stringify(pendingOrg?.status));
const approved = await call('PATCH', `/platform/organizations/${orgId}`, { status: 'ACTIVE' }, adminToken);
check('approve tenant 200', approved.ok, JSON.stringify(approved.data).slice(0, 180));
check('tenant is ACTIVE after approval', approved.data.status === 'ACTIVE', JSON.stringify(approved.data.status));
const audit = await call('GET', '/platform/audit?limit=60', undefined, adminToken);
check(
  'PLATFORM_ORG_APPROVED audited',
  (audit.data.logs || audit.data.auditLogs || []).some(l => l.action === 'PLATFORM_ORG_APPROVED' && l.target === orgId),
  JSON.stringify((audit.data.logs || []).slice(0, 5))
);

console.log('\n[4] approved owner signs in with a real session');
const signin = await call('POST', '/auth/login', { email, password });
check('login 200 after approval', signin.ok, JSON.stringify(signin.data).slice(0, 200));
check('login returns a token', Boolean(signin.data.token));
check('session reports ACTIVE organization', signin.data.organization?.status === 'ACTIVE', JSON.stringify(signin.data.organization?.status));
const tenantToken = signin.data.token;
const me = await call('GET', '/auth/me', undefined, tenantToken);
check('GET /auth/me 200', me.ok, JSON.stringify(me.data).slice(0, 160));
check('session role is AGENCY_OWNER', me.data.user?.role === 'AGENCY_OWNER', JSON.stringify(me.data.user?.role));
check('session plan is STARTER', me.data.organization?.plan === 'STARTER', JSON.stringify(me.data.organization?.plan));

console.log('\n[5] role & plan gated entitlements');
const ent = await call('GET', '/entitlements', undefined, tenantToken);
check('GET /entitlements 200', ent.ok);
check('plan modules exposed', Array.isArray(ent.data.modules) && ent.data.modules.length > 0, JSON.stringify(ent.data.modules));
const modules = ent.data.modules || [];
check('core CRM modules unlocked', ['dashboard', 'leads', 'customers', 'quotations', 'bookings'].every(m => modules.includes(m)), JSON.stringify(modules));
check('starter plan keeps premium modules locked', !modules.includes('visa') && !modules.includes('finance') && !modules.includes('suppliers') && !modules.includes('subagent'), JSON.stringify(modules));
check('starter plan reports 4 allowed roles', ent.data.allowedRoles?.length === 4, JSON.stringify(ent.data.allowedRoles));
check('owner role entitled on starter', ent.data.role?.allowed === true, JSON.stringify(ent.data.role));
check('tenant is not entitled to platform console', !modules.includes('superadmin'), JSON.stringify(modules));

console.log('\n[6] won lead becomes a customer record');
const lead = await call(
  'POST',
  '/collections/leads',
  {
    name: 'Won Lead Smoke',
    phone: '+923001112233',
    email: `won-${stamp}@example.com`,
    city: 'Lahore',
    source: 'WhatsApp',
    destination: 'Istanbul, Turkey',
    travellerCount: 2,
    budgetPKR: 450000,
    stage: 'NEW',
    priority: 'HIGH',
    assignedTo: 'Hamza Tariq'
  },
  tenantToken
);
check('lead created', lead.status === 201, JSON.stringify(lead.data).slice(0, 200));
const leadId = lead.data.id;
check('lead carries an id', Boolean(leadId));

const stageSet = await call('PUT', '/collections/leads', { items: [{ ...lead.data, stage: 'CONFIRMED' }] }, tenantToken);
check('lead replace accepted', stageSet.ok, JSON.stringify(stageSet.data).slice(0, 200));
check('won lead converted by the API', Array.isArray(stageSet.data.convertedCustomers) && stageSet.data.convertedCustomers.includes(`CUST-${leadId}`), JSON.stringify(stageSet.data));

const customers = await call('GET', '/collections/customers?limit=100', undefined, tenantToken);
const converted = (customers.data.data || []).find(c => c.id === `CUST-${leadId}`);
check('customer record exists', Boolean(converted), JSON.stringify((customers.data.data || []).map(c => c.id)));
check('customer provenance carries the lead id', converted?.leadId === leadId, JSON.stringify(converted?.leadId));
check('customer carries the lead details', converted?.name === 'Won Lead Smoke' && converted?.phone === '+923001112233' && converted?.destination === undefined, JSON.stringify(converted));
check('customer typed as Won Lead', converted?.customerType === 'Won Lead', JSON.stringify(converted?.customerType));
check('customer stat fields default safely', converted?.lifetimeSpendPKR === 0 && converted?.travellerCount === 2, JSON.stringify([converted?.lifetimeSpendPKR, converted?.travellerCount]));
const storedLead = await call('GET', `/collections/leads/${leadId}`, undefined, tenantToken);
check('won lead links back to its customer', storedLead.data.customerId === `CUST-${leadId}`, JSON.stringify(storedLead.data.customerId));

const replay = await call('PUT', '/collections/leads', { items: [{ ...lead.data, stage: 'CONFIRMED' }] }, tenantToken);
check('replay does not reconvert', Array.isArray(replay.data.convertedCustomers) && replay.data.convertedCustomers.length === 0, JSON.stringify(replay.data));
const customers2 = await call('GET', '/collections/customers?limit=100', undefined, tenantToken);
const matches = (customers2.data.data || []).filter(c => c.leadId === leadId);
check('conversion is idempotent (one record per lead)', matches.length === 1, `got ${matches.length}`);

const directWon = await call(
  'POST',
  '/collections/leads',
  { name: 'Instant Win', phone: '+923009998877', destination: 'Dubai, UAE', stage: 'CONFIRMED', source: 'Referral' },
  tenantToken
);
check('lead created already-won converts immediately', Array.isArray(directWon.data.convertedCustomers) && directWon.data.convertedCustomers.includes(`CUST-${directWon.data.id}`), JSON.stringify(directWon.data));

const stats = await call('GET', '/collections/customers/stats/summary', undefined, tenantToken);
check('customer stats report the new records', stats.ok && stats.data.total >= 2, JSON.stringify(stats.data));

console.log('\n[7] visa case keeps customer details & documents');
const originalCases = await call('GET', '/collections/visaCases?limit=100', undefined, tenantToken);
const originalItems = originalCases.data.data || [];

const newCase = {
  id: 'VISA-SMOKE-1',
  customerName: 'Smoke Visa Applicant',
  destination: 'United Kingdom',
  visaType: 'Standard Visitor Visa (6 Months)',
  applicantCount: 1,
  assignedOfficer: 'Ayesha Khan',
  referenceNumber: 'GWF-SMOKE-001',
  externalProvider: 'UKVI / VFS',
  status: 'NEW',
  priority: 'HIGH',
  applicationDate: '2026-09-24',
  intendedTravelDate: '2026-11-04',
  visaFeePKR: 48500,
  serviceFeePKR: 35000,
  totalCustomerPricePKR: 83500,
  supplierCostPKR: 48500,
  expectedMarginPKR: 35000,
  customer: {
    phone: '+92 300 1112233',
    whatsapp: '+92 300 1112233',
    email: `visa-${stamp}@example.com`,
    cnic: '35201-1234567-1',
    passportNumber: 'AL9821043',
    passportExpiry: '2031-06-09',
    nationality: 'Pakistani',
    dateOfBirth: '1978-04-12',
    city: 'Lahore',
    address: 'House 18, Block G, DHA Phase 5, Lahore',
    occupation: 'Director',
    notes: 'Smoke test applicant.'
  },
  documents: [
    { id: 'doc-smoke-1', name: 'Passport Scans', category: 'Identity', status: 'VERIFIED', fileName: 'passport.pdf', uploadedAt: '2026-09-24', notes: 'Colour scan' },
    { id: 'doc-smoke-2', name: 'Bank Statement', category: 'Financial', status: 'UPLOADED', fileName: 'bank.pdf', uploadedAt: '2026-09-24', notes: '' }
  ],
  checklists: [
    { id: 'chk-smoke-1', name: 'Passport first page (colour scan)', status: 'PENDING', required: true, notes: 'Required before submission.' }
  ]
};

const caseWrite = await call('PUT', '/collections/visaCases', { items: [newCase, ...originalItems] }, tenantToken);
check('visa case replace accepted', caseWrite.ok, JSON.stringify(caseWrite.data).slice(0, 200));

const readBack = await call('GET', '/collections/visaCases?limit=100', undefined, tenantToken);
const storedCase = (readBack.data.data || []).find(item => item.id === 'VISA-SMOKE-1');
check('visa case stored', Boolean(storedCase), JSON.stringify((readBack.data.data || []).map(item => item.id)));
check('customer detail kept on save', storedCase?.customer?.phone === '+92 300 1112233' && storedCase?.customer?.email === `visa-${stamp}@example.com`, JSON.stringify(storedCase?.customer));
check('passport & address kept on save', storedCase?.customer?.passportNumber === 'AL9821043' && storedCase?.customer?.address?.includes('DHA Phase 5'), JSON.stringify(storedCase?.customer));
check('documents kept on save', Array.isArray(storedCase?.documents) && storedCase.documents.length === 2 && storedCase.documents[0].fileName === 'passport.pdf', JSON.stringify(storedCase?.documents));
check('document status kept on save', storedCase?.documents?.[1]?.status === 'UPLOADED', JSON.stringify(storedCase?.documents?.[1]));
check('embassy checklist kept on save', storedCase?.checklists?.length === 1 && storedCase.checklists[0].status === 'PENDING', JSON.stringify(storedCase?.checklists));

const caseEdit = await call(
  'PATCH',
  '/collections/visaCases/VISA-SMOKE-1',
  {
    status: 'UNDER_REVIEW',
    customer: { ...storedCase.customer, city: 'Islamabad' },
    documents: storedCase.documents.map(doc =>
      doc.id === 'doc-smoke-2' ? { ...doc, status: 'VERIFIED' } : doc
    )
  },
  tenantToken
);
check('case edit accepted', caseEdit.ok, JSON.stringify(caseEdit.data).slice(0, 200));
const afterEdit = (await call('GET', '/collections/visaCases?limit=100', undefined, tenantToken)).data.data || [];
const editedCase = afterEdit.find(item => item.id === 'VISA-SMOKE-1');
check('case status monitored & updated', editedCase?.status === 'UNDER_REVIEW', JSON.stringify(editedCase?.status));
check('customer detail edited', editedCase?.customer?.city === 'Islamabad', JSON.stringify(editedCase?.customer?.city));
check('document verified by the officer', editedCase?.documents?.find(doc => doc.id === 'doc-smoke-2')?.status === 'VERIFIED', JSON.stringify(editedCase?.documents));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log('failures:');
  failures.forEach(item => console.log(` - ${item}`));
  process.exitCode = 1;
}

console.log('\n[cleanup] remove provisioned tenant + reconcile Supabase');
execSync('npx tsx scripts/remove-smoke-orgs.ts', { cwd: SERVER_DIR, stdio: 'inherit' });
execSync('npx tsx scripts/reconcile-supabase.ts --apply', { cwd: SERVER_DIR, stdio: 'inherit' });
