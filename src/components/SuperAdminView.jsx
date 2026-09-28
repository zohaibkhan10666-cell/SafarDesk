import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Activity, 
  HardDrive, 
  Users, 
  Clock, 
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Power,
  X,
  Sparkles
  ,MessageCircle, Edit3, SlidersHorizontal, Flag, CreditCard, Lock, MapPin, TrendingUp, Minus, Eye
  ,Database, RefreshCw, Copy, Loader2, Server, Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import { writePublicPlansCache } from '../lib/publicPlans';
import { checkSupabaseFromBrowser } from '../lib/supabaseClient';
import {
  initialOrganizations,
  initialAuditLogs,
  initialPlatformConfigRules,
  initialFeatureFlags,
  initialRoleActivity,
  initialBuyerActivity
} from '../data/mockData';

/* ------------------------------------------------------------------ */
/* Platform Console — shared presentation helpers (README §19)        */
/* ------------------------------------------------------------------ */

const CONSOLE_TABS = [
  { id: 'tenants',      label: 'Tenants & Subscriptions', icon: Building2 },
  { id: 'config',       label: 'Platform Configuration',  icon: ShieldCheck },
  { id: 'enforcement',  label: 'Enforcement Engine',      icon: Lock },
  { id: 'buyers',       label: 'Plan Buyer Analytics',    icon: CreditCard },
  { id: 'roles',        label: 'Role Activity',           icon: Activity },
  { id: 'database',     label: 'Supabase Database',       icon: Database }
];

const SCOPE_ORDER = ['PLAN', 'ORGANIZATION', 'USER', 'BRANCH', 'ROLE', 'FEATURE'];

/* Audit rows the Super Admin removes from the stream stay hidden on this console
   (display-only adjustment — the server audit trail itself is never rewritten). */
const AUDIT_HIDDEN_KEY = 'safardesk.superadmin.audit.hidden';

function readHiddenAuditIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUDIT_HIDDEN_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/** The 9 tenant role categories a subscription plan can grant (README §19.1 · domain 1). */
const TENANT_ROLES = [
  { id: 'AGENCY_OWNER', label: 'Owner / CEO' },
  { id: 'AGENCY_MANAGER', label: 'Manager' },
  { id: 'TRAVEL_CONSULTANT', label: 'Consultant' },
  { id: 'VISA_OFFICER', label: 'Visa Officer' },
  { id: 'ACCOUNTANT', label: 'Accountant' },
  { id: 'OPERATIONS_STAFF', label: 'Operations' },
  { id: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { id: 'SUB_AGENT', label: 'Sub-Agent' },
  { id: 'CUSTOMER', label: 'Customer Portal' }
];

const SCOPE_META = {
  PLAN:          { label: 'Subscription Plan', icon: CreditCard, tint: 'var(--mint)',  dim: 'var(--mint-dim)',  border: 'rgba(31,229,163,0.3)',  blurb: 'Quotas & entitlements every plan buyer inherits' },
  ORGANIZATION:  { label: 'Organization',      icon: Building2, tint: 'var(--cyan)',   dim: 'var(--cyan-dim)',  border: 'rgba(45,168,240,0.3)',  blurb: 'Rules that bind every tenant agency' },
  USER:          { label: 'User & Seat',       icon: Users,     tint: 'var(--cyan)',   dim: 'var(--cyan-dim)',  border: 'rgba(45,168,240,0.3)',  blurb: 'Seats, sign-in and session policy' },
  BRANCH:        { label: 'Branch',            icon: MapPin,    tint: 'var(--amber)',  dim: 'var(--amber-dim)', border: 'rgba(229,176,74,0.3)',  blurb: 'Branch quotas and branch hygiene' },
  ROLE:          { label: 'Role & RBAC',       icon: ShieldCheck, tint: 'var(--mint)', dim: 'var(--mint-dim)',  border: 'rgba(31,229,163,0.3)',  blurb: 'Role catalog and permission matrix' },
  FEATURE:       { label: 'Feature Flag',      icon: Flag,      tint: 'var(--violet)', dim: 'var(--violet-dim)', border: 'rgba(155,107,240,0.3)', blurb: 'Module rollout per plan tier' }
};

const MODE_META = {
  HARD_BLOCK: { label: 'HARD BLOCK', className: 'badge-red',   hint: 'Request rejected with reason' },
  SOFT_WARN:  { label: 'SOFT WARN',  className: 'badge-amber', hint: 'Allowed, flagged in audit stream' },
  OFF:        { label: 'OFF',        className: 'badge-muted', hint: 'Rule paused by the platform owner' }
};

const MODE_ORDER = ['HARD_BLOCK', 'SOFT_WARN', 'OFF'];

function nextMode(mode) {
  const i = MODE_ORDER.indexOf(mode);
  return MODE_ORDER[(i + 1) % MODE_ORDER.length];
}

function ModeBadge({ mode, onCycle }) {
  const meta = MODE_META[mode] || MODE_META.OFF;
  return (
    <button
      type="button"
      onClick={onCycle}
      title={`${meta.hint} — click to rotate enforcement mode`}
      className={`${meta.className} px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity`}
    >
      {meta.label}
    </button>
  );
}

function ScopeChip({ scope }) {
  const meta = SCOPE_META[scope];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide"
      style={{ background: meta.dim, color: meta.tint, border: `1px solid ${meta.border}` }}
    >
      <Icon className="w-3 h-3" />
      {scope}
    </span>
  );
}

function UsageBar({ label, used, limit, unit = '', format }) {
  const safeLimit = Number(limit) || 0;
  const safeUsed = Number(used) || 0;
  const pct = safeLimit > 0 ? Math.min(100, Math.round((safeUsed / safeLimit) * 100)) : 0;
  const tone = pct >= 100 ? 'var(--red)' : pct >= 85 ? 'var(--amber)' : 'var(--mint)';
  const usedText = format ? format(safeUsed) : `${safeUsed}${unit}`;
  const limitText = safeLimit > 0 ? (format ? format(safeLimit) : `${safeLimit}${unit}`) : '∞';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-[var(--text-3)]">{label}</span>
        <span style={{ color: tone }}>{usedText} / {limitText}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}

function StatTile({ eyebrow, value, sub, tone = 'var(--cyan)' }) {
  return (
    <div className="sd-card p-4 space-y-1">
      <span className="mono-eyebrow text-[10px]" style={{ color: tone }}>{eyebrow}</span>
      <div className="text-xl font-bold font-mono text-[var(--text)]">{value}</div>
      <div className="text-[11px] text-[var(--text-3)] font-body">{sub}</div>
    </div>
  );
}

function FlagSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0"
      style={{
        background: checked ? 'var(--mint)' : 'rgba(255,255,255,0.10)',
        border: `1px solid ${checked ? 'rgba(31,229,163,0.5)' : 'var(--line-2)'}`
      }}
    >
      <span
        className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black/70 transition-[left]"
        style={{ left: checked ? 18 : 3 }}
      />
    </button>
  );
}

function parseRenewal(dateStr = '') {
  const pastDue = /past due/i.test(dateStr);
  const ts = Date.parse(String(dateStr).slice(0, 10));
  const days = Number.isNaN(ts) ? null : Math.ceil((ts - Date.now()) / 86400000);
  return { pastDue, days };
}

const RISK_TONE = {
  LOW:    { className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', color: 'var(--mint)' },
  MEDIUM: { className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', color: 'var(--amber)' },
  HIGH:   { className: 'bg-red-500/20 text-red-400 border border-red-500/30', color: 'var(--red)' }
};

const STATUS_TONE = {
  COMPLIANT:  { className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', color: 'var(--mint)' },
  'AT RISK':  { className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', color: 'var(--amber)' },
  'OVER LIMIT': { className: 'bg-red-500/20 text-red-400 border border-red-500/30', color: 'var(--red)' },
  LOCKED:     { className: 'bg-red-500/20 text-red-400 border border-red-500/30', color: 'var(--red)' }
};

const TREND_META = {
  UP:     { icon: TrendingUp, color: 'var(--mint)', label: 'Rising' },
  STABLE: { icon: Minus,      color: 'var(--text-3)', label: 'Stable' },
  QUIET:  { icon: Minus,      color: 'var(--text-3)', label: 'Quiet' }
};


export default function SuperAdminView({ initialTab = 'tenants' }) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');
  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [isOwnerWhatsAppOpen, setIsOwnerWhatsAppOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [auditQuery, setAuditQuery] = useState('');
  const [hiddenAuditIds, setHiddenAuditIds] = useState(() => readHiddenAuditIds());
  const [plans, setPlans] = useState([
    { id: 'STARTER', name: 'Agency Starter', price: 18000, roles: 4, branches: 1, storageGB: 1, features: 'Leads, quotations, bookings' },
    { id: 'BUSINESS', name: 'Business Growth', price: 42000, roles: 10, branches: 3, storageGB: 5, features: 'WhatsApp, visa, finance, reports' },
    { id: 'AGENCY_PRO', name: 'Agency Enterprise Pro', price: 85000, roles: 25, branches: 10, storageGB: 20, features: 'All modules, API, audit exports' }
  ]);
  const [planDraft, setPlanDraft] = useState(null);

  // Platform Console (README §19) — configuration, enforcement & analytics
  const [consoleTab, setConsoleTab] = useState(initialTab);
  const [configRules, setConfigRules] = useState(initialPlatformConfigRules);
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);
  const [expandedBuyer, setExpandedBuyer] = useState(null);
  const [buyerPlanFilter, setBuyerPlanFilter] = useState('ALL');

  // Server-backed console state (README §19) — falls back to the seeded demo data.
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [roleActivity, setRoleActivity] = useState(null);
  const [enforcementTenants, setEnforcementTenants] = useState(null);
  const [consoleMessage, setConsoleMessage] = useState(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [planMessage, setPlanMessage] = useState(null);
  const [orgMessage, setOrgMessage] = useState(null);
  const [orgBusy, setOrgBusy] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);

  // Supabase database console — live probe (backend) + browser health check
  const [sbStatus, setSbStatus] = useState(null);
  const [sbBrowser, setSbBrowser] = useState(null);
  const [sbBusy, setSbBusy] = useState(null);
  const [sbMessage, setSbMessage] = useState(null);
  const [sbPreviewTable, setSbPreviewTable] = useState('Organization');
  const [sbPreview, setSbPreview] = useState(null);
  const [sbPreviewBusy, setSbPreviewBusy] = useState(false);

  const loadSupabase = async (busyKey = 'load') => {
    setSbBusy(busyKey);
    try {
      const status = await api.platform.supabase();
      setSbStatus(status);
      setSbBrowser(await checkSupabaseFromBrowser());
    } catch (error) {
      setSbMessage({ type: 'error', text: error.message });
    } finally {
      setSbBusy(null);
    }
  };

  const applySchemaNow = async () => {
    setSbBusy('setup');
    try {
      const { data } = await api.platform.supabaseSetup();
      if (data?.setup?.ok) {
        setSbMessage({
          type: 'ok',
          text: `${data.setup.message}${data.sync ? ` ${data.sync.message}` : ''}`
        });
      } else if (data?.setup?.channel === 'none') {
        setSbMessage({
          type: 'error',
          text: 'No schema channel on the server yet — use “Open SQL Editor” (SQL prefilled) or add SUPABASE_DB_URL / SUPABASE_ACCESS_TOKEN to server/.env.'
        });
      } else {
        setSbMessage({ type: 'error', text: data?.setup?.message || 'Schema could not be applied.' });
      }
      await loadSupabase();
    } catch (error) {
      setSbBusy(null);
      setSbMessage({ type: 'error', text: error.message });
    }
  };

  const syncNow = async () => {
    setSbBusy('sync');
    try {
      const { data } = await api.platform.supabaseSync();
      setSbMessage(
        data?.sync?.ok
          ? { type: 'ok', text: data.sync.message }
          : { type: 'error', text: data?.sync?.message || 'Sync failed' }
      );
      if (data?.probe) setSbStatus((prev) => (prev ? { ...prev, probe: data.probe } : prev));
    } catch (error) {
      setSbMessage({ type: 'error', text: error.message });
    } finally {
      setSbBusy(null);
    }
  };

  const supabaseProjectRef = (sbStatus?.env?.url || '').replace('https://', '').split('.')[0];

  const openSqlEditor = async () => {
    try {
      const sql = await api.platform.supabaseSql();
      const target = `https://supabase.com/dashboard/project/${supabaseProjectRef}/sql/new?content=${encodeURIComponent(sql)}`;
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setSbMessage({ type: 'error', text: error.message });
    }
  };

  const copySql = async () => {
    try {
      const sql = await api.platform.supabaseSql();
      await navigator.clipboard.writeText(sql);
      setSbMessage({ type: 'ok', text: `Migration SQL copied (${sql.length} bytes) — paste it into the SQL editor and press Run.` });
    } catch (error) {
      setSbMessage({ type: 'error', text: error.message });
    }
  };

  const loadPreview = async (table = sbPreviewTable) => {
    setSbPreviewBusy(true);
    try {
      const { data } = await api.platform.supabasePreview(table, 5);
      setSbPreview(data);
    } catch (error) {
      setSbPreview(null);
      setSbMessage({ type: 'error', text: `Supabase read failed: ${error.message}` });
    } finally {
      setSbPreviewBusy(false);
    }
  };

  useEffect(() => {
    if (consoleTab === 'database' && !sbStatus && !sbBusy) loadSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consoleTab]);

  useEffect(() => {
    if (consoleTab === 'database' && sbStatus?.probe?.ready) loadPreview(sbPreviewTable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consoleTab, sbPreviewTable, sbStatus?.probe?.ready]);

  /* ---------------- Console data from the API (README §19 lenses) ---------------- */
  const toAuditRows = (logs) => (logs || []).map((log) => ({ ...log, branch: log.branch || 'Platform' }));

  /* Plan catalog writes keep the console state and the public-site mirror in step —
     the public home & pricing sections render this same catalog (lib/publicPlans.js). */
  const applyPlans = (rows) => {
    if (!Array.isArray(rows)) return;
    setPlans(rows);
    writePublicPlansCache(rows);
  };

  const reloadPlans = async () => {
    try {
      const { plans } = await api.platform.plans();
      if (Array.isArray(plans) && plans.length) applyPlans(plans);
    } catch {
      // Offline / older API — the seeded catalog stays on screen.
    }
  };
  const reloadOrgs = async () => {
    try {
      const { organizations } = await api.platform.organizations();
      if (Array.isArray(organizations) && organizations.length) setOrganizations(organizations);
    } catch {
      // keep local rows
    }
  };
  const reloadAudit = async () => {
    try {
      const { logs } = await api.platform.audit(60);
      if (Array.isArray(logs) && logs.length) setAuditLogs(toAuditRows(logs));
    } catch {
      // keep local rows
    }
  };
  const reloadEnforcement = async () => {
    try {
      const { tenants } = await api.platform.enforcement();
      if (Array.isArray(tenants) && tenants.length) setEnforcementTenants(tenants);
    } catch {
      // local compliance view stays
    }
  };

  const loadPlatformData = async () => {
    await Promise.all([
      reloadPlans(),
      (async () => {
        try {
          const config = await api.platform.config();
          if (Array.isArray(config?.rules) && config.rules.length) setConfigRules(config.rules);
          if (Array.isArray(config?.featureFlags) && config.featureFlags.length) setFeatureFlags(config.featureFlags);
        } catch {
          // keep seeded configuration
        }
      })(),
      reloadOrgs(),
      reloadEnforcement(),
      (async () => {
        try {
          const { roles } = await api.platform.roles();
          if (Array.isArray(roles) && roles.length) setRoleActivity(roles);
        } catch {
          // keep seeded role analytics
        }
      })(),
      reloadAudit()
    ]);
  };

  useEffect(() => {
    loadPlatformData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New Agency state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+92');
  const [newHq, setNewHq] = useState('Lahore, Punjab');
  const [newPlan, setNewPlan] = useState('BUSINESS');
  const [newDts, setNewDts] = useState('DTS-LHR-');

  const totalMRR = organizations.filter(o => o.status === 'ACTIVE').reduce((acc, o) => acc + o.mrrPKR, 0);
  const totalAgencies = organizations.length;
  const totalCasesPlatform = organizations.reduce((acc, o) => acc + o.activeCasesCount, 0);
  const totalStorageGB = (organizations.reduce((acc, o) => acc + o.storageUsedMB, 0) / 1024).toFixed(1);
  const pendingApprovals = organizations.filter(o => o.status === 'PENDING').length;

  const filteredOrgs = organizations.filter(org => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = org.name.toLowerCase().includes(q) || 
                          org.ownerName.toLowerCase().includes(q) || 
                          org.dtsLicense.toLowerCase().includes(q);
    const matchesPlan = selectedPlanFilter === 'ALL' || org.plan === selectedPlanFilter;
    return matchesSearch && matchesPlan;
  });

  const toggleOrgStatus = async (orgId) => {
    const before = organizations;
    const target = before.find(o => o.id === orgId);
    if (!target) return;
    const nextStatus = target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const approved = target.status === 'PENDING' && nextStatus === 'ACTIVE';
    setOrganizations(before.map(o => (o.id === orgId ? { ...o, status: nextStatus } : o)));
    try {
      await api.platform.updateOrganization(orgId, { status: nextStatus });
      setConsoleMessage({
        type: 'ok',
        text: approved
          ? `${target.name} approved — the owner can sign in now (rule-org-approval).`
          : `${target.name} is now ${nextStatus} and enforced platform-wide.`
      });
      await Promise.all([reloadOrgs(), reloadEnforcement(), reloadAudit()]);
    } catch (error) {
      setOrganizations(before);
      setConsoleMessage({ type: 'error', text: error.message });
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName || !newOwnerName) return;
    setOrgMessage(null);
    setOrgBusy(true);
    try {
      const org = await api.platform.createOrganization({
        name: newOrgName,
        ownerName: newOwnerName,
        email: newEmail,
        phone: newPhone,
        headquarters: newHq,
        dtsLicense: newDts,
        plan: newPlan
      });
      setOrganizations([org, ...organizations]);
      setIsNewOrgModalOpen(false);
      setNewOrgName('');
      setNewOwnerName('');
      setNewEmail('');
      setConsoleMessage({ type: 'ok', text: `${org.name} provisioned on ${org.plan} — owner account is live.` });
      await Promise.all([reloadOrgs(), reloadPlans(), reloadEnforcement(), reloadAudit()]);
    } catch (error) {
      setOrgMessage({ type: 'error', text: error.message });
    } finally {
      setOrgBusy(false);
    }
  };

  const openPlanEditor = (plan) => {
    setPlanDraft({
      ...plan,
      storageGB: plan.storageGB ?? 1,
      description: plan.description ?? '',
      sortOrder: plan.sortOrder ?? 0,
      isActive: plan.isActive ?? true,
      allowedRoles: Array.isArray(plan.allowedRoles) && plan.allowedRoles.length
        ? plan.allowedRoles
        : TENANT_ROLES.map(role => role.id)
    });
    setIsNewPlan(false);
    setPlanMessage(null);
    setIsPlanModalOpen(true);
  };

  const openNewPlan = () => {
    setPlanDraft({
      id: '',
      name: '',
      price: 30000,
      roles: 5,
      branches: 2,
      storageGB: 2,
      features: '',
      description: '',
      sortOrder: plans.length + 1,
      isActive: true,
      allowedRoles: TENANT_ROLES.map(role => role.id)
    });
    setIsNewPlan(true);
    setPlanMessage(null);
    setIsPlanModalOpen(true);
  };

  const duplicatePlan = (plan) => {
    openPlanEditor(plan);
    setPlanDraft(draft => ({ ...draft, id: '', name: `${plan.name} Copy` }));
    setIsNewPlan(true);
  };

  const togglePlanRole = (roleId) => {
    setPlanDraft(draft => {
      const active = Array.isArray(draft.allowedRoles) ? draft.allowedRoles : [];
      return {
        ...draft,
        allowedRoles: active.includes(roleId)
          ? active.filter(id => id !== roleId)
          : [...active, roleId]
      };
    });
  };

  const planPayload = () => ({
    name: String(planDraft.name || '').trim(),
    price: Number(planDraft.price) || 0,
    roles: Number(planDraft.roles) || 1,
    branches: Number(planDraft.branches) || 1,
    storageGB: Number(planDraft.storageGB) || 0,
    features: String(planDraft.features || '').trim() || '—',
    description: String(planDraft.description || '').trim(),
    allowedRoles: planDraft.allowedRoles || [],
    sortOrder: Number(planDraft.sortOrder) || 0,
    isActive: planDraft.isActive !== false
  });

  const savePlan = async (e) => {
    e.preventDefault();
    const payload = planPayload();
    if (!payload.name) {
      setPlanMessage({ type: 'error', text: 'Plan name is required.' });
      return;
    }
    setPlanBusy(true);
    setPlanMessage(null);
    try {
      const result = isNewPlan
        ? await api.platform.createPlan({ id: String(planDraft.id || '').trim().toUpperCase(), ...payload })
        : await api.platform.updatePlan(planDraft.id, payload);
      applyPlans(result?.plans);
      setIsPlanModalOpen(false);
      setConsoleMessage({
        type: 'ok',
        text: `${payload.name} saved — price, quotas and role access now apply to every buyer on this plan.`
      });
      await Promise.all([reloadOrgs(), reloadEnforcement(), reloadAudit()]);
    } catch (error) {
      setPlanMessage({ type: 'error', text: error.message });
    } finally {
      setPlanBusy(false);
    }
  };

  const togglePlanActive = async (plan) => {
    try {
      const result = await api.platform.updatePlan(plan.id, { isActive: plan.isActive === false });
      applyPlans(result?.plans);
      setConsoleMessage({
        type: 'ok',
        text: plan.isActive === false
          ? `${plan.name} reopened for new buyers.`
          : `${plan.name} paused — existing buyers keep it, new sign-ups are blocked.`
      });
      await reloadAudit();
    } catch (error) {
      setConsoleMessage({ type: 'error', text: error.message });
    }
  };

  const deletePlan = async (plan) => {
    const confirmed = window.confirm(
      `Delete ${plan.name} (${plan.id}) from the catalog? Only plans with no buyers can be removed.`
    );
    if (!confirmed) return;
    setPlanBusy(true);
    setPlanMessage(null);
    try {
      const result = await api.platform.deletePlan(plan.id);
      applyPlans(result?.plans);
      setIsPlanModalOpen(false);
      setConsoleMessage({ type: 'ok', text: `Plan ${plan.id} removed from the catalog.` });
      await Promise.all([reloadOrgs(), reloadAudit()]);
    } catch (error) {
      setPlanMessage({ type: 'error', text: error.message });
    } finally {
      setPlanBusy(false);
    }
  };

  const openAgencyEditor = (org) => { setSelectedOrg({ ...org }); setOrgMessage(null); setIsAgencyModalOpen(true); };
  const saveAgency = async (e) => {
    e.preventDefault();
    setOrgMessage(null);
    setOrgBusy(true);
    try {
      const updated = await api.platform.updateOrganization(selectedOrg.id, {
        name: selectedOrg.name,
        ownerName: selectedOrg.ownerName,
        email: selectedOrg.email,
        phone: selectedOrg.phone,
        headquarters: selectedOrg.headquarters,
        dtsLicense: selectedOrg.dtsLicense,
        branchesCount: Number(selectedOrg.branchesCount) || 0,
        usersCount: Number(selectedOrg.usersCount) || 0
      });
      setOrganizations(organizations.map(org => (org.id === updated.id ? updated : org)));
      setIsAgencyModalOpen(false);
      setConsoleMessage({ type: 'ok', text: `${updated.name} saved through the policy engine.` });
      await Promise.all([reloadOrgs(), reloadPlans(), reloadEnforcement(), reloadAudit()]);
    } catch (error) {
      setOrgMessage({ type: 'error', text: error.message });
    } finally {
      setOrgBusy(false);
    }
  };
  const hideAuditRow = (id) => {
    setHiddenAuditIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(AUDIT_HIDDEN_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const restoreAuditRows = () => {
    setHiddenAuditIds(new Set());
    try { localStorage.removeItem(AUDIT_HIDDEN_KEY); } catch {}
  };

  const filteredAuditLogs = auditLogs
    .filter(log => !hiddenAuditIds.has(log.id))
    .filter(log => `${log.actor} ${log.action} ${log.target} ${log.details}`.toLowerCase().includes(auditQuery.toLowerCase()));

  /* ---------------- Platform configuration state (README §19.1) ---------------- */
  const planById = useMemo(() => plans.reduce((acc, plan) => ({ ...acc, [plan.id]: plan }), {}), [plans]);

  const rulesByScope = useMemo(() => configRules.reduce((acc, rule) => {
    if (!acc[rule.scope]) acc[rule.scope] = [];
    acc[rule.scope].push(rule);
    return acc;
  }, {}), [configRules]);

  const activeRules = configRules.filter(rule => rule.mode !== 'OFF').length;
  const hardBlocks = configRules.filter(rule => rule.mode === 'HARD_BLOCK').length;

  const cycleRuleMode = async (ruleId) => {
    const rule = configRules.find(entry => entry.id === ruleId);
    if (!rule) return;
    const mode = nextMode(rule.mode);
    setConfigRules(rules => rules.map(entry => (entry.id === ruleId ? { ...entry, mode } : entry)));
    try {
      await api.platform.updateRule(ruleId, { mode });
      await reloadAudit();
    } catch (error) {
      setConfigRules(rules => rules.map(entry => (entry.id === ruleId ? { ...entry, mode: rule.mode } : entry)));
      setConsoleMessage({ type: 'error', text: error.message });
    }
  };
  const updateRuleValue = (ruleId, value) =>
    setConfigRules(rules => rules.map(rule => rule.id === ruleId ? { ...rule, value } : rule));
  const commitRuleValue = async (ruleId) => {
    const rule = configRules.find(entry => entry.id === ruleId);
    if (!rule) return;
    try {
      await api.platform.updateRule(ruleId, { value: rule.value });
      await reloadAudit();
    } catch (error) {
      setConsoleMessage({ type: 'error', text: error.message });
    }
  };
  const toggleFeatureFlag = async (flagId) => {
    const flag = featureFlags.find(entry => entry.id === flagId);
    if (!flag) return;
    const enabled = !flag.enabled;
    setFeatureFlags(flags => flags.map(entry => (entry.id === flagId ? { ...entry, enabled } : entry)));
    try {
      await api.platform.updateFlag(flagId, { enabled });
      await reloadAudit();
    } catch (error) {
      setFeatureFlags(flags => flags.map(entry => (entry.id === flagId ? { ...entry, enabled: flag.enabled } : entry)));
      setConsoleMessage({ type: 'error', text: error.message });
    }
  };

  /* ---------------- Automatic enforcement view (README §19.2) ---------------- */
  const compliance = useMemo(() => {
    const rows = organizations.map(org => {
      const plan = planById[org.plan] || {};
      const checks = [
        { key: 'seats',    label: 'Seats',        used: org.usersCount,    limit: Number(plan.roles) || 0,             unit: '' },
        { key: 'branches', label: 'Branches',     used: org.branchesCount, limit: Number(plan.branches) || 0,          unit: '' },
        { key: 'storage',  label: 'Vault storage', used: org.storageUsedMB, limit: (Number(plan.storageGB) || 0) * 1024, unit: ' MB' }
      ];
      const over = checks.some(c => c.limit > 0 && c.used >= c.limit);
      const near = checks.some(c => c.limit > 0 && c.used / c.limit >= 0.85);
      const locked = org.status !== 'ACTIVE';
      const status = locked ? 'LOCKED' : over ? 'OVER LIMIT' : near ? 'AT RISK' : 'COMPLIANT';
      return { org, plan, checks, status, locked };
    });
    if (!enforcementTenants?.length) return rows;
    return rows.map(row => {
      const server = enforcementTenants.find(tenant => tenant.id === row.org.id);
      if (!server) return row;
      return {
        ...row,
        status: server.status,
        locked: server.blockedWrites,
        checks: (server.checks || []).map(check => ({
          ...check,
          unit: check.key === 'storage' ? ' MB' : '',
          format: check.key === 'storage' ? (value) => `${(Number(value) / 1024).toFixed(1)} GB` : undefined
        }))
      };
    });
  }, [organizations, planById, enforcementTenants]);

  const compliantTenants = compliance.filter(row => row.status === 'COMPLIANT').length;
  const complianceRate = compliance.length ? Math.round((compliantTenants / compliance.length) * 100) : 100;
  const blockedAttempts = useMemo(
    () => auditLogs.filter(log => /BLOCK|DENIED|DENY|REJECT/i.test(log.action || '')).length,
    [auditLogs]
  );

  /* ---------------- Plan buyer analytics (README §19.3) ---------------- */
  const buyerRows = useMemo(() => organizations.map(org => {
    const plan = planById[org.plan] || {};
    const activity = initialBuyerActivity[org.id] || {
      actions30d: 0, logins30d: 0, denied30d: 0, lastActive: '—', supportTickets: 0, health: 70, risk: 'MEDIUM'
    };
    const renewal = parseRenewal(org.renewalDate);
    const row = compliance.find(item => item.org.id === org.id);
    return { org, plan, activity, renewal, compliance: row };
  }), [organizations, planById, compliance]);

  const filteredBuyers = useMemo(
    () => buyerRows.filter(row => buyerPlanFilter === 'ALL' || row.org.plan === buyerPlanFilter),
    [buyerRows, buyerPlanFilter]
  );

  const buyerRollup = useMemo(() => {
    const renewalsSoon = buyerRows.filter(row => !row.renewal.pastDue && row.renewal.days !== null && row.renewal.days <= 30).length;
    const pastDue = buyerRows.filter(row => row.renewal.pastDue).length;
    const healthValues = buyerRows.map(row => row.activity.health);
    const avgHealth = healthValues.length ? Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 0;
    return { renewalsSoon, pastDue, avgHealth };
  }, [buyerRows]);

  /* ---------------- Role activity analytics (README §19.4) ---------------- */
  const roleStats = useMemo(() => {
    const seedByRole = initialRoleActivity.reduce((acc, role) => ({ ...acc, [role.role]: role }), {});
    const source = Array.isArray(roleActivity) && roleActivity.length ? roleActivity : initialRoleActivity;
    const maxActions = Math.max(1, ...source.map(role => role.actions30d || 0));
    return source.map(role => {
      const seed = seedByRole[role.role] || {};
      return {
        ...seed,
        ...role,
        label: role.label || seed.label || role.role,
        modules: role.modules || seed.modules || '',
        share: Math.round(((role.actions30d || 0) / maxActions) * 100)
      };
    });
  }, [roleActivity]);

  const roleTotals = useMemo(() => roleStats.reduce((acc, role) => ({
    users: acc.users + (role.users || 0),
    actions: acc.actions + (role.actions30d || 0),
    denied: acc.denied + (role.denied30d || 0)
  }), { users: 0, actions: 0, denied: 0 }), [roleStats]);

  const auditByRole = useMemo(() => {
    const counts = {};
    auditLogs.forEach(log => {
      counts[log.role] = counts[log.role] || { role: log.role, events: 0, last: '' };
      counts[log.role].events += 1;
      if (log.timestamp > counts[log.role].last) counts[log.role].last = log.timestamp;
    });
    return Object.values(counts).sort((a, b) => b.events - a.events);
  }, [auditLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              SafarDesk Platform Super Admin Console
            </h1>
            <span className="badge-cyan text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              README §3 (Platform Owner)
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Multi-tenant agency accounts, SaaS subscription MRR, database tenant health, and platform governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlanModalOpen(true)} className="btn-secondary-pill"><SlidersHorizontal className="w-4 h-4" /><span>Manage SaaS Plans</span></button>
          <button onClick={() => setIsOwnerWhatsAppOpen(true)} className="p-2 rounded-full bg-[#25D366] text-black" title="Open owner WhatsApp hub"><MessageCircle className="w-4 h-4" /></button>
          <button
            onClick={() => setIsNewOrgModalOpen(true)}
            className="btn-primary-pill shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision Agency Tenant</span>
          </button>
        </div>
      </div>

      {/* Platform Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sd-card p-5 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--cyan)]">Monthly Recurring Revenue</span>
          <div className="text-2xl font-bold font-mono text-[var(--mint)]">
            PKR {totalMRR.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">From active SaaS subscription tiers</div>
        </div>

        <div className="sd-card p-5 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--mint)]">Registered Agencies</span>
          <div className="text-2xl font-bold font-mono text-[var(--text)]">
            {totalAgencies} Organizations
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">Across Punjab, Sindh & Islamabad</div>
        </div>

        <div className="sd-card p-5 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--amber)]">Active Travel Cases</span>
          <div className="text-2xl font-bold font-mono text-[var(--amber)]">
            {totalCasesPlatform} Platform Cases
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">Leads, visas, & flight bookings</div>
        </div>

        <div className="sd-card p-5 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--cyan)]">Platform System Health</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            99.98%
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">{totalStorageGB} GB Secure Vault Storage</div>
        </div>
      </div>

      {/* Platform Console lenses — README §19.5 */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--line)] overflow-x-auto">
        {CONSOLE_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = consoleTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setConsoleTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs font-semibold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <span className="ml-auto hidden lg:flex items-center gap-1.5 px-3 text-[10px] font-mono text-[var(--text-3)] whitespace-nowrap">
          <span className="pulse-mint" />
          POLICY SYNCED · {activeRules}/{configRules.length} RULES ACTIVE
        </span>
      </div>

      {consoleMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start justify-between gap-3 px-3 py-2 rounded-xl border text-xs font-body ${
            consoleMessage.type === 'error'
              ? 'bg-[var(--red-dim)] border-[rgba(240,74,90,0.3)] text-[var(--red)]'
              : 'bg-[var(--mint-dim)] border-[rgba(31,229,163,0.3)] text-[var(--mint)]'
          }`}
        >
          <span>{consoleMessage.text}</span>
          <button
            type="button"
            onClick={() => setConsoleMessage(null)}
            aria-label="Dismiss message"
            className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {consoleTab === 'tenants' && (
        <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
          {['ALL', ...plans.map(plan => plan.id)].map(plan => (
            <button
              key={plan}
              onClick={() => setSelectedPlanFilter(plan)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                selectedPlanFilter === plan
                  ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              {plan === 'ALL' ? 'All Plans' : plan.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agencies, owners, DTS..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--line-2)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--mint)]"
          />
        </div>
      </div>

      {/* Multi-Tenant Agencies Directory */}
      <div className="sd-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] font-display">
              Tenant Travel Agencies & Subscriptions
            </h3>
            <p className="text-xs text-[var(--text-3)] font-body">
              Isolated organization databases with dedicated branch quotas, seats, and billing status
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingApprovals > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                role="status"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(229,176,74,0.35)] bg-[var(--amber-dim)] px-2.5 py-1 text-[10px] font-mono font-bold text-[var(--amber)]"
                title="Self-registered workspaces waiting for approval (rule-org-approval)"
              >
                <Clock className="w-3 h-3" /> {pendingApprovals} pending approval
              </button>
            )}
            <Building2 className="w-6 h-6 text-[var(--cyan)]" />
          </div>
        </div>

        <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-body divide-y divide-[var(--line)]">
          <div className="grid grid-cols-12 p-3 font-semibold text-[var(--text-3)] bg-[var(--surface-2)]">
            <div className="col-span-4">Agency Organization & Owner</div>
            <div className="col-span-2">DTS Accreditation</div>
            <div className="col-span-2">SaaS Plan & MRR</div>
            <div className="col-span-2 text-center">Branches / Cases</div>
            <div className="col-span-2 text-right">Status & Action</div>
          </div>

          {filteredOrgs.map(org => {
            const isActive = org.status === 'ACTIVE';
            const isPending = org.status === 'PENDING';

            return (
              <div key={org.id} className="grid grid-cols-12 p-3.5 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                <div className="col-span-4 space-y-0.5">
                  <div className="font-bold text-sm text-[var(--text)] font-display">{org.name}</div>
                  <div className="text-[11px] text-[var(--text-3)]">
                    Owner: <strong className="text-[var(--text)]">{org.ownerName}</strong> · {org.headquarters}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--cyan)]">{org.email} · {org.phone}</div>
                </div>

                <div className="col-span-2">
                  <span className="font-mono font-bold text-xs text-[var(--text)]">{org.dtsLicense}</span>
                  <div className="text-[10px] text-[var(--text-3)]">Since {org.createdDate}</div>
                </div>

                <div className="col-span-2 space-y-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    org.plan === 'AGENCY_PRO' ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]' :
                    org.plan === 'BUSINESS' ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.3)]' :
                    'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(229,176,74,0.3)]'
                  }`}>
                    {org.plan}
                  </span>
                  <div className="font-mono text-xs font-semibold text-[var(--mint)]">
                    PKR {org.mrrPKR.toLocaleString()} / mo
                  </div>
                  <div className="text-[10px] text-[var(--text-3)]">Renewal: {org.renewalDate}</div>
                </div>

                <div className="col-span-2 text-center space-y-0.5">
                  <div className="font-mono font-semibold text-xs text-[var(--text)]">
                    {org.branchesCount} Branches · {org.usersCount} Seats
                  </div>
                  <div className="text-[10px] text-[var(--cyan)] font-mono">
                    {org.activeCasesCount} Active Cases ({org.storageUsedMB} MB)
                  </div>
                </div>

                <div className="col-span-2 text-right space-y-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    isPending ? 'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(229,176,74,0.3)]' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {org.status}
                  </span>

                  <div>
                    <button
                      onClick={() => { setConsoleTab('buyers'); setExpandedBuyer(org.id); }}
                      className="text-[11px] text-[var(--mint)] hover:underline flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" /> Monitor activity
                    </button>
                    <button onClick={() => openAgencyEditor(org)} className="text-[11px] text-[var(--cyan)] hover:underline flex items-center gap-1 ml-auto"><Edit3 className="w-3 h-3" /> Edit agency</button>
                    <button
                      onClick={() => toggleOrgStatus(org.id)}
                      title={isPending ? 'Approve this workspace so its owner can sign in (rule-org-approval)' : undefined}
                      className={`text-[11px] font-semibold flex items-center gap-1 ml-auto ${
                        isActive ? 'text-[var(--red)] hover:underline' : 'text-[var(--mint)] hover:underline'
                      }`}
                    >
                      {isPending ? <CheckCircle2 className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                      <span>
                        {isPending ? 'Approve & activate'
                          : isActive ? 'Suspend Access'
                          : 'Reactivate Tenant'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* LENS 2 — Platform Configuration (Super Admin owns the config) */}
      {/* ============================================================= */}
      {consoleTab === 'config' && (
        <div className="space-y-6">
          <div className="sd-card p-5 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ background: 'var(--mint-dim)', border: '1px solid rgba(31,229,163,0.3)' }}>
                <ShieldCheck className="w-5 h-5 text-[var(--mint)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">
                  Platform Configuration — owned by the Super Admin (SaaS Owner)
                </h3>
                <p className="text-xs text-[var(--text-3)] font-body mt-0.5">
                  Authored once at platform level. The system enforces it automatically for every organization, user, branch, role and subscription plan — a tenant can consume it, never override it.
                </p>
              </div>
            </div>
            <div className="lg:ml-auto flex flex-wrap items-center gap-2">
              <span className="badge-cyan px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">{configRules.length} RULES</span>
              <span className="badge-red px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">{hardBlocks} HARD BLOCKS</span>
              <span className="badge-muted px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">{configRules.length - activeRules} PAUSED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {SCOPE_ORDER.map(scope => {
              const rules = rulesByScope[scope] || [];
              const meta = SCOPE_META[scope];
              const Icon = meta.icon;
              return (
                <div key={scope} className="sd-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--line)]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: meta.dim, border: `1px solid ${meta.border}` }}>
                        <Icon className="w-4 h-4" style={{ color: meta.tint }} />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-[var(--text)] font-display">{meta.label}</div>
                        <div className="text-[11px] text-[var(--text-3)] font-body">{meta.blurb}</div>
                      </div>
                    </div>
                    <span className="mono-eyebrow text-[9px] shrink-0">{rules.length} rules</span>
                  </div>

                  <div className="space-y-3">
                    {rules.map(rule => (
                      <div key={rule.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-[var(--text)] font-body">{rule.title}</div>
                            <div className="text-[11px] text-[var(--text-3)] font-body leading-relaxed">{rule.description}</div>
                          </div>
                          <ModeBadge mode={rule.mode} onCycle={() => cycleRuleMode(rule.id)} />
                        </div>

                        <label className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[var(--text-3)] shrink-0">VALUE</span>
                          <input
                            value={rule.value}
                            onChange={(e) => updateRuleValue(rule.id, e.target.value)}
                            onBlur={() => commitRuleValue(rule.id)}
                            aria-label={`${rule.title} value`}
                            className="flex-1 min-w-0 px-2 py-1.5 text-[11px] font-mono rounded-md bg-[var(--surface)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                          />
                        </label>

                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                          <span className="text-[var(--text-3)]">Applies to {rule.applies}</span>
                          <span style={{ color: rule.mode === 'OFF' ? 'var(--text-3)' : 'var(--mint)' }}>
                            {rule.mode === 'OFF' ? 'PAUSED BY OWNER' : 'AUTO-ENFORCED BY SYSTEM'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sd-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Subscription Plan Quotas</h3>
                <p className="text-xs text-[var(--text-3)] font-body">Seats, branches and vault storage the engine grants to every buyer on each plan.</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(true)} className="btn-secondary-pill"><SlidersHorizontal className="w-4 h-4" /><span>Manage plans</span></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      plan.id === 'AGENCY_PRO' ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]' :
                      plan.id === 'BUSINESS' ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.3)]' :
                      'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(229,176,74,0.3)]'
                    }`}>{plan.id}</span>
                    <span className="font-mono text-xs font-semibold text-[var(--mint)]">PKR {Number(plan.price).toLocaleString()}</span>
                  </div>
                  <div className="text-xs font-bold text-[var(--text)] font-display">{plan.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[['Seats', plan.roles], ['Branches', plan.branches], ['Storage', `${plan.storageGB} GB`]].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-[var(--surface)] border border-[var(--line)] py-2">
                        <div className="text-sm font-mono font-bold text-[var(--text)]">{value}</div>
                        <div className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-wider">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-[var(--text-3)] font-body leading-relaxed">{plan.features}</div>
                  <button onClick={() => openPlanEditor(plan)} className="w-full text-[11px] text-[var(--cyan)] hover:underline flex items-center justify-center gap-1">
                    <Edit3 className="w-3 h-3" /> Edit quota configuration
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sd-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Feature Flags & Plan Entitlement</h3>
                <p className="text-xs text-[var(--text-3)] font-body">Modules the platform releases per plan tier — entitlement is checked on every module request.</p>
              </div>
              <Flag className="w-5 h-5 text-[var(--violet)]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featureFlags.map(flag => (
                <div key={flag.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 flex items-start gap-3">
                  <FlagSwitch checked={flag.enabled} onChange={() => toggleFeatureFlag(flag.id)} label={`Toggle ${flag.label}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text)] font-body">{flag.label}</div>
                    <div className="text-[11px] text-[var(--text-3)] font-body">{flag.description}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plans.map(plan => plan.id).map(planId => {
                        const entitled = flag.plans.includes(planId);
                        return (
                          <span
                            key={planId}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              entitled
                                ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]'
                                : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-3)] border border-[var(--line)] line-through'
                            }`}
                          >
                            {planId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${flag.enabled ? 'text-[var(--mint)]' : 'text-[var(--text-3)]'}`}>
                    {flag.enabled ? 'LIVE' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* LENS 3 — Automatic Enforcement Engine                          */}
      {/* ============================================================= */}
      {consoleTab === 'enforcement' && (
        <div className="space-y-6">
          <div className="sd-card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Automatic Enforcement Engine</h3>
                <p className="text-xs text-[var(--text-3)] font-body">
                  Configuration flows into the policy engine; every organization, user, branch, role and plan is checked on each request — no manual policing required.
                </p>
              </div>
              <span className="badge-cyan px-2.5 py-1 rounded-full text-[10px] font-mono font-bold whitespace-nowrap">SERVER-SIDE · platform.admin</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              {['PLATFORM CONFIG', 'POLICY ENGINE', 'ORGANIZATION', 'USER', 'BRANCH', 'ROLE', 'PLAN'].map((step, index) => (
                <React.Fragment key={step}>
                  {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)] shrink-0" />}
                  <span className={`px-2 py-1 rounded-md border whitespace-nowrap ${
                    index < 2
                      ? 'bg-[var(--mint-dim)] text-[var(--mint)] border-[rgba(31,229,163,0.3)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--line)]'
                  }`}>{step}</span>
                </React.Fragment>
              ))}
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)] shrink-0" />
              <span className="px-2 py-1 rounded-md border bg-[var(--mint-dim)] text-[var(--mint)] border-[rgba(31,229,163,0.3)] whitespace-nowrap">ALLOW</span>
              <span className="px-2 py-1 rounded-md border bg-[var(--red-dim)] text-[var(--red)] border-[rgba(240,74,90,0.3)] whitespace-nowrap">DENY → AUDIT</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile eyebrow="Rules Enforced" value={`${activeRules} / ${configRules.length}`} sub={`${hardBlocks} hard blocks · ${configRules.length - activeRules} paused`} tone="var(--mint)" />
            <StatTile eyebrow="Tenants Checked" value={organizations.length} sub="Organizations under automatic policy" tone="var(--cyan)" />
            <StatTile eyebrow="Blocked Attempts (30d)" value={blockedAttempts} sub="Over-quota & permission denials" tone="var(--red)" />
            <StatTile eyebrow="Compliance Rate" value={`${complianceRate}%`} sub={`${compliantTenants} of ${compliance.length} tenants fully compliant`} tone="var(--amber)" />
          </div>

          <div className="sd-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Rule Engine Status</h3>
                <p className="text-xs text-[var(--text-3)] font-body">Every configuration rule and how the system is currently applying it. Click a mode chip to rotate HARD BLOCK → SOFT WARN → OFF.</p>
              </div>
              <span className="badge-muted px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">{activeRules} ENFORCED</span>
            </div>
            <div className="border border-[var(--line)] rounded-xl overflow-hidden divide-y divide-[var(--line)] text-xs font-body">
              <div className="grid grid-cols-12 gap-2 p-3 bg-[var(--surface-2)] font-mono text-[9px] uppercase tracking-wider text-[var(--text-3)] font-bold">
                <div className="col-span-4">Configuration rule</div>
                <div className="col-span-2">Scope</div>
                <div className="col-span-2">Enforcement mode</div>
                <div className="col-span-2">Applies to</div>
                <div className="col-span-2 text-right">Engine status</div>
              </div>
              {configRules.map(rule => (
                <div key={rule.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                  <div className="col-span-4">
                    <div className="font-semibold text-[var(--text)]">{rule.title}</div>
                    <div className="text-[10px] text-[var(--text-3)] font-mono">{rule.domain}</div>
                  </div>
                  <div className="col-span-2"><ScopeChip scope={rule.scope} /></div>
                  <div className="col-span-2"><ModeBadge mode={rule.mode} onCycle={() => cycleRuleMode(rule.id)} /></div>
                  <div className="col-span-2 font-mono text-[11px] text-[var(--text-2)]">{rule.applies}</div>
                  <div className="col-span-2 text-right">
                    <span className={`text-[10px] font-mono font-bold ${rule.mode === 'OFF' ? 'text-[var(--text-3)]' : 'text-[var(--mint)]'}`}>
                      {rule.mode === 'OFF' ? 'PAUSED' : 'ENFORCED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sd-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Per-Tenant Compliance Matrix</h3>
                <p className="text-xs text-[var(--text-3)] font-body">Each plan buyer measured against its plan quota — checked automatically, every time usage changes.</p>
              </div>
              <span className="badge-amber px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">{complianceRate}% COMPLIANT</span>
            </div>
            <div className="border border-[var(--line)] rounded-xl overflow-hidden divide-y divide-[var(--line)] text-xs font-body">
              <div className="grid grid-cols-12 gap-2 p-3 bg-[var(--surface-2)] font-mono text-[9px] uppercase tracking-wider text-[var(--text-3)] font-bold">
                <div className="col-span-3">Tenant</div>
                <div className="col-span-5">Quota usage vs plan</div>
                <div className="col-span-2">Write access</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              {compliance.map(({ org, checks, status, locked }) => {
                const tone = STATUS_TONE[status] || STATUS_TONE.COMPLIANT;
                return (
                  <div key={org.id} className="grid grid-cols-12 gap-3 p-3.5 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                    <div className="col-span-3 space-y-0.5">
                      <div className="text-xs font-bold text-[var(--text)] font-display">{org.name}</div>
                      <div className="text-[10px] font-mono text-[var(--text-3)]">{org.plan} · {org.branchesCount} br · {org.usersCount} seats</div>
                    </div>
                    <div className="col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {checks.map(check => (
                        <UsageBar
                          key={check.key}
                          label={check.label}
                          used={check.used}
                          limit={check.limit}
                          unit={check.unit}
                          format={check.key === 'storage' ? (value => `${(Number(value) / 1024).toFixed(1)} GB`) : undefined}
                        />
                      ))}
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-[11px] font-mono" style={{ color: locked ? 'var(--red)' : 'var(--text-2)' }}>
                      <Lock className="w-3 h-3 shrink-0" />
                      {locked ? 'Writes blocked' : 'Writes allowed'}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${tone.className}`}>{status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* LENS 4 — Plan Buyer Analytics                                  */}
      {/* ============================================================= */}
      {consoleTab === 'buyers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile eyebrow="Plan Buyers" value={buyerRows.length} sub={`${buyerRollup.renewalsSoon} renewing within 30 days`} tone="var(--cyan)" />
            <StatTile eyebrow="Past-Due Buyers" value={buyerRollup.pastDue} sub="Renewal breached — suspension pending" tone="var(--red)" />
            <StatTile eyebrow="Avg Buyer Health" value={`${buyerRollup.avgHealth}%`} sub="Usage, billing & activity composite" tone="var(--mint)" />
            <StatTile eyebrow="Blocked (30d)" value={blockedAttempts} sub="Policy denials across all buyers" tone="var(--amber)" />
          </div>

          <div className="sd-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Revenue & Buyers per Plan</h3>
                <p className="text-xs text-[var(--text-3)] font-body">Commercial rollup of every plan buyer on the platform.</p>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] overflow-x-auto">
                {['ALL', ...plans.map(plan => plan.id)].map(planId => (
                  <button
                    key={planId}
                    onClick={() => setBuyerPlanFilter(planId)}
                    className={`px-3 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                      buyerPlanFilter === planId
                        ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                        : 'text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    {planId === 'ALL' ? 'All Plans' : planId.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => {
                const buyers = organizations.filter(org => org.plan === plan.id);
                const planMRR = buyers.reduce((acc, org) => acc + org.mrrPKR, 0);
                const share = totalMRR ? Math.round((planMRR / totalMRR) * 100) : 0;
                return (
                  <div key={plan.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text)] font-display">{plan.name}</span>
                      <span className="text-[10px] font-mono text-[var(--text-3)]">{buyers.length} buyers</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-[var(--mint)]">
                      PKR {planMRR.toLocaleString()}<span className="text-[10px] text-[var(--text-3)] font-normal"> /mo</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] overflow-hidden">
                      <div className="h-full transition-[width] duration-500" style={{ width: `${share}%`, background: 'linear-gradient(90deg, var(--mint), var(--cyan))' }} />
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-3)]">{share}% of platform MRR</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sd-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Plan Buyer Monitor</h3>
                <p className="text-xs text-[var(--text-3)] font-body">Open a buyer to inspect quota usage, 30-day activity, billing health and governance status.</p>
              </div>
              <CreditCard className="w-5 h-5 text-[var(--cyan)]" />
            </div>

            <div className="border border-[var(--line)] rounded-xl overflow-hidden divide-y divide-[var(--line)] text-xs font-body">
              {filteredBuyers.map(({ org, plan, activity, renewal, compliance: rowCompliance }) => {
                const isOpen = expandedBuyer === org.id;
                const risk = RISK_TONE[activity.risk] || RISK_TONE.MEDIUM;
                const statusTone = STATUS_TONE[rowCompliance?.status] || STATUS_TONE.COMPLIANT;
                return (
                  <div key={org.id}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3.5 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                      <div className="lg:col-span-4 space-y-0.5">
                        <div className="text-sm font-bold text-[var(--text)] font-display">{org.name}</div>
                        <div className="text-[11px] text-[var(--text-3)]">Owner: <strong className="text-[var(--text)]">{org.ownerName}</strong> · {org.headquarters}</div>
                      </div>

                      <div className="lg:col-span-2 flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          org.plan === 'AGENCY_PRO' ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]' :
                          org.plan === 'BUSINESS' ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.3)]' :
                          'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(229,176,74,0.3)]'
                        }`}>{org.plan}</span>
                        <span className="font-mono text-[11px] text-[var(--mint)]">PKR {org.mrrPKR.toLocaleString()}/mo</span>
                      </div>

                      <div className="lg:col-span-2 font-mono">
                        <div className={`text-[11px] ${renewal.pastDue ? 'text-[var(--red)] font-semibold' : 'text-[var(--text-2)]'}`}>
                          {renewal.pastDue ? 'Renewal past due' : renewal.days !== null && renewal.days >= 0 ? `Renews in ${renewal.days}d` : 'Renewal settled'}
                        </div>
                        <div className="text-[10px] text-[var(--text-3)]">{org.renewalDate}</div>
                      </div>

                      <div className="lg:col-span-3 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-[var(--text-3)]">Health</span>
                            <span style={{ color: risk.color }}>{activity.health}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] overflow-hidden">
                            <div className="h-full transition-[width] duration-500" style={{ width: `${activity.health}%`, background: risk.color }} />
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${risk.className}`}>{activity.risk}</span>
                      </div>

                      <div className="lg:col-span-1 text-right">
                        <button
                          onClick={() => setExpandedBuyer(isOpen ? null : org.id)}
                          aria-expanded={isOpen}
                          className="text-[11px] text-[var(--cyan)] hover:underline inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {isOpen ? 'Hide' : 'Monitor'}
                          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-4 py-4 bg-[var(--surface-2)]/50 border-t border-[var(--line)] grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2.5">
                          <div className="mono-eyebrow text-[10px]">Quota usage vs {org.plan}</div>
                          {rowCompliance.checks.map(check => (
                            <UsageBar
                              key={check.key}
                              label={check.label}
                              used={check.used}
                              limit={check.limit}
                              unit={check.unit}
                              format={check.key === 'storage' ? (value => `${(Number(value) / 1024).toFixed(1)} GB`) : undefined}
                            />
                          ))}
                          <div className="text-[10px] font-mono font-bold" style={{ color: statusTone.color }}>
                            STATUS · {rowCompliance.status}
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="mono-eyebrow text-[10px]">Activity — last 30 days</div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              ['Actions', activity.actions30d],
                              ['Logins', activity.logins30d],
                              ['Blocked', activity.denied30d],
                              ['Tickets', activity.supportTickets]
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-lg bg-[var(--surface)] border border-[var(--line)] p-2">
                                <div className={`text-sm font-mono font-bold ${label === 'Blocked' && value > 0 ? 'text-[var(--red)]' : 'text-[var(--text)]'}`}>{value}</div>
                                <div className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-wider">{label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-3)]">Last active: {activity.lastActive}</div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="mono-eyebrow text-[10px]">Governance</div>
                          <div className="space-y-1 text-[11px] font-mono text-[var(--text-2)]">
                            <div>Plan · <span className="text-[var(--text)]">{plan.name || org.plan}</span></div>
                            <div>DTS · <span className="text-[var(--text)]">{org.dtsLicense}</span></div>
                            <div>Buyer since · <span className="text-[var(--text)]">{org.createdDate}</span></div>
                            <div>Tenant status · <span className={org.status === 'ACTIVE' ? 'text-[var(--mint)]' : org.status === 'PENDING' ? 'text-[var(--amber)]' : 'text-[var(--red)]'}>{org.status}</span></div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button onClick={() => openAgencyEditor(org)} className="text-[11px] text-[var(--cyan)] hover:underline inline-flex items-center gap-1">
                              <Edit3 className="w-3 h-3" /> Edit agency
                            </button>
                            <button
                              onClick={() => toggleOrgStatus(org.id)}
                              className={`text-[11px] font-semibold inline-flex items-center gap-1 ${org.status === 'ACTIVE' ? 'text-[var(--red)] hover:underline' : 'text-[var(--mint)] hover:underline'}`}
                            >
                              {org.status === 'PENDING' ? <CheckCircle2 className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                              {org.status === 'ACTIVE' ? 'Suspend tenant' : org.status === 'PENDING' ? 'Approve & activate' : 'Reactivate'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredBuyers.length === 0 && (
                <div className="p-6 text-center text-xs text-[var(--text-3)]">No plan buyers match this filter.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* LENS 5 — Role Activity Analytics                               */}
      {/* ============================================================= */}
      {consoleTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile eyebrow="Roles Tracked" value={roleStats.length} sub="Fixed platform role catalog" tone="var(--cyan)" />
            <StatTile eyebrow="Users Across Roles" value={roleTotals.users} sub="Seats held platform-wide" tone="var(--mint)" />
            <StatTile eyebrow="Actions (30d)" value={roleTotals.actions.toLocaleString()} sub="Recorded platform activity" tone="var(--amber)" />
            <StatTile eyebrow="Permission Denied" value={roleTotals.denied} sub="Blocked by the RBAC matrix" tone="var(--red)" />
          </div>

          <div className="sd-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Role Activity Across All Tenants</h3>
                <p className="text-xs text-[var(--text-3)] font-body">Every role, every organization — one view of who is doing what, and where the platform had to step in.</p>
              </div>
              <span className="badge-cyan px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">README §19.4</span>
            </div>

            <div className="border border-[var(--line)] rounded-xl overflow-hidden divide-y divide-[var(--line)] text-xs font-body">
              <div className="grid grid-cols-12 gap-2 p-3 bg-[var(--surface-2)] font-mono text-[9px] uppercase tracking-wider text-[var(--text-3)] font-bold">
                <div className="col-span-3">Role</div>
                <div className="col-span-2">Activity (30d)</div>
                <div className="col-span-2">Seats / Tenants</div>
                <div className="col-span-2">Logins / Denied</div>
                <div className="col-span-2">Top action</div>
                <div className="col-span-1 text-right">Trend</div>
              </div>
              {roleStats.map(role => {
                const TrendIcon = (TREND_META[role.trend] || TREND_META.STABLE).icon;
                const trendMeta = TREND_META[role.trend] || TREND_META.STABLE;
                return (
                  <div key={role.role} className="grid grid-cols-12 gap-2 p-3.5 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                    <div className="col-span-3">
                      <div className="font-semibold text-[var(--text)]">{role.label}</div>
                      <div className="text-[10px] text-[var(--text-3)] font-mono">{role.role} · {role.modules}</div>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <div className="font-mono text-[11px] text-[var(--text)]">{role.actions30d.toLocaleString()}</div>
                      <div className="h-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] overflow-hidden">
                        <div className="h-full transition-[width] duration-500" style={{ width: `${role.share}%`, background: 'linear-gradient(90deg, var(--mint), var(--cyan))' }} />
                      </div>
                    </div>
                    <div className="col-span-2 font-mono text-[11px] text-[var(--text-2)]">{role.users} / {role.tenants}</div>
                    <div className="col-span-2 font-mono text-[11px]">
                      <span className="text-[var(--text-2)]">{role.logins30d}</span>
                      <span className={role.denied30d > 0 ? 'text-[var(--red)] font-semibold' : 'text-[var(--text-3)]'}> / {role.denied30d} denied</span>
                    </div>
                    <div className="col-span-2 font-mono text-[10px] text-[var(--cyan)]">{role.topAction}</div>
                    <div className="col-span-1 flex justify-end" title={trendMeta.label}>
                      <TrendIcon className="w-4 h-4" style={{ color: trendMeta.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="sd-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] font-display">Live Audit by Role</h3>
                  <p className="text-xs text-[var(--text-3)] font-body">Platform audit events grouped by the role that produced them.</p>
                </div>
                <Activity className="w-5 h-5 text-[var(--mint)]" />
              </div>
              <div className="border border-[var(--line)] rounded-xl overflow-hidden divide-y divide-[var(--line)] text-xs font-body">
                {auditByRole.map(entry => (
                  <div key={entry.role} className="grid grid-cols-12 gap-2 p-3 items-center">
                    <div className="col-span-5 font-semibold text-[var(--text)]">{entry.role}</div>
                    <div className="col-span-3 font-mono text-[11px] text-[var(--mint)]">{entry.events} events</div>
                    <div className="col-span-4 font-mono text-[10px] text-[var(--text-3)] text-right">Last {entry.last}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {auditLogs.filter(log => !hiddenAuditIds.has(log.id)).map(log => (
                  <div key={log.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3 text-[11px] font-body">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--text)]">{log.actor}</span>
                      <span className="font-mono text-[10px] text-[var(--mint)]">{log.action}</span>
                    </div>
                    <div className="text-[var(--text-3)] mt-1 leading-relaxed">{log.details}</div>
                    <div className="font-mono text-[10px] text-[var(--text-3)] mt-1">{log.role} · {log.branch} · {log.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sd-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] font-display">Escalation Watchlist</h3>
                  <p className="text-xs text-[var(--text-3)] font-body">Roles the platform had to refuse — permission or quota denials in the last 30 days.</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-[var(--amber)]" />
              </div>
              <div className="space-y-2">
                {roleStats.filter(role => role.denied30d > 0).map(role => (
                  <div key={role.role} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: 'var(--red-dim)', border: '1px solid rgba(240,74,90,0.3)' }}>
                      <Lock className="w-4 h-4 text-[var(--red)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[var(--text)] font-body">{role.label}</div>
                      <div className="text-[10px] font-mono text-[var(--text-3)] truncate">{role.topAction} · {role.modules}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-[var(--red)]">{role.denied30d}</div>
                      <div className="text-[9px] font-mono text-[var(--text-3)] uppercase">denied</div>
                    </div>
                  </div>
                ))}
                {roleStats.filter(role => role.denied30d > 0).length === 0 && (
                  <div className="p-6 text-center text-xs text-[var(--text-3)]">No permission denials recorded — the RBAC matrix is holding.</div>
                )}
              </div>
              <div className="rounded-xl border border-[rgba(31,229,163,0.2)] bg-[var(--mint-dim)]/40 p-4 text-[11px] font-body text-[var(--text-2)] leading-relaxed">
                <strong className="text-[var(--mint)]">Automatic control:</strong> role permissions are authored by the Super Admin in Platform Configuration and applied by the policy engine — a tenant cannot widen a role, grant <span className="font-mono">platform.admin</span>, or exceed its plan seats.
              </div>
            </div>
          </div>
        </div>
      )}

      {consoleTab === 'database' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="sd-card p-5 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(45,168,240,0.3)' }}>
                <Database className="w-5 h-5 text-[var(--cyan)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Supabase Database — connection &amp; data plane</h3>
                <p className="text-xs text-[var(--text-3)] font-body mt-0.5">
                  The API reads and writes Supabase with the secret key via <span className="font-mono">@supabase/server</span>; the browser only holds the publishable key. Local SQLite stays the primary store and every row is mirrored into Supabase.
                </p>
              </div>
            </div>
            <div className="lg:ml-auto flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => loadSupabase()} disabled={Boolean(sbBusy)} className="btn-secondary-pill">
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${sbBusy === 'load' ? 'animate-spin' : ''}`} /> Refresh
                </span>
              </button>
              <button type="button" onClick={syncNow} disabled={Boolean(sbBusy) || !(sbStatus?.probe?.ready)} className="btn-primary-pill">
                <span className="inline-flex items-center gap-1.5">
                  {sbBusy === 'sync' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  {sbBusy === 'sync' ? 'Syncing…' : 'Sync data now'}
                </span>
              </button>
            </div>
          </div>

          {sbMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border p-3 text-xs leading-relaxed ${
                sbMessage.type === 'ok'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {sbMessage.text}
            </div>
          )}

          {!sbStatus ? (
            <div className="sd-card p-8 text-center text-xs text-[var(--text-3)]">
              <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
              Loading Supabase connection status…
            </div>
          ) : (
            <>
              {/* Status tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  {
                    label: 'API connection',
                    value: !sbStatus.env.configured
                      ? 'NOT CONFIGURED'
                      : sbStatus.probe.reachable
                        ? `REACHABLE · HTTP ${sbStatus.probe.restStatus}`
                        : 'UNREACHABLE',
                    tint: sbStatus.probe.ready ? 'var(--mint)' : 'var(--amber)'
                  },
                  {
                    label: 'Auth · JWKS',
                    value: sbStatus.probe.jwksOk ? `LIVE · ${sbStatus.probe.jwksKeys} key(s)` : 'JWKS UNAVAILABLE',
                    tint: sbStatus.probe.jwksOk ? 'var(--mint)' : 'var(--red)'
                  },
                  {
                    label: 'Schema',
                    value: `${(sbStatus.probe.tables || []).filter((t) => t.exists).length}/${(sbStatus.probe.tables || []).length} tables`,
                    tint: sbStatus.probe.ready ? 'var(--mint)' : 'var(--amber)'
                  },
                  {
                    label: 'Browser',
                    value: !sbBrowser
                      ? 'CHECKING…'
                      : sbBrowser.ok
                        ? 'CONNECTED'
                        : sbBrowser.configured
                          ? 'BLOCKED'
                          : 'NO VITE KEY',
                    tint: sbBrowser?.ok ? 'var(--mint)' : 'var(--amber)'
                  }
                ].map((tile) => (
                  <div key={tile.label} className="sd-card p-4 space-y-1">
                    <div className="mono-eyebrow text-[9px]">{tile.label}</div>
                    <div className="text-sm font-bold font-mono" style={{ color: tile.tint }}>{tile.value}</div>
                  </div>
                ))}
              </div>

              {/* Schema action callout */}
              {sbStatus.probe.missingTables?.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--amber)] mt-0.5 shrink-0" />
                    <div className="text-xs text-[var(--text-2)] leading-relaxed">
                      <strong className="text-[var(--amber)]">Schema not applied yet.</strong> API keys can read and write Supabase, but creating tables is DDL — it needs a server-side channel ({sbStatus.setup.channels.databaseUrl ? `${sbStatus.setup.channels.dsnVar} set` : 'DATABASE_URL not set'}, {sbStatus.setup.channels.accessToken ? 'SUPABASE_ACCESS_TOKEN set' : 'SUPABASE_ACCESS_TOKEN not set'}) or one run in the SQL editor below.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={openSqlEditor} className="btn-primary-pill">
                      <span className="inline-flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Open SQL Editor (schema prefilled)</span>
                    </button>
                    <button type="button" onClick={copySql} className="btn-secondary-pill">
                      <span className="inline-flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy SQL</span>
                    </button>
                    <button type="button" onClick={applySchemaNow} disabled={Boolean(sbBusy)} className="btn-secondary-pill">
                      <span className="inline-flex items-center gap-1.5"><Server className="w-3.5 h-3.5" /> Apply from server</span>
                    </button>
                    <a
                      href={sbStatus.setup.dashboardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-[var(--cyan)] hover:underline"
                    >
                      Open plain SQL editor →
                    </a>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--text-3)]">
                    {sbStatus.setup.migrationFile} · {sbStatus.setup.sqlBytes} bytes · {sbStatus.setup.tables.length} tables
                  </p>
                </div>
              )}

              {/* Table matrix: local vs Supabase */}
              <div className="sd-card p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)] font-display">Table mirror status</h4>
                    <p className="text-xs text-[var(--text-3)] font-body">Row counts in the local SQLite primary store compared with Supabase Postgres.</p>
                  </div>
                  <span className="mono-eyebrow text-[9px]">{sbStatus.setup.tables.length} TABLES</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] font-mono uppercase tracking-wide text-[var(--text-3)] border-b border-[var(--line)]">
                        <th className="py-2 pr-4 font-medium">Table</th>
                        <th className="py-2 pr-4 font-medium">Supabase</th>
                        <th className="py-2 pr-4 font-medium">Rows in Supabase</th>
                        <th className="py-2 pr-4 font-medium">Rows locally</th>
                        <th className="py-2 font-medium">Mirror</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {sbStatus.setup.tables.map((name) => {
                        const row = (sbStatus.probe.tables || []).find((t) => t.name === name);
                        const localRows = sbStatus.local?.[name];
                        return (
                          <tr key={name}>
                            <td className="py-2 pr-4 font-mono text-[var(--text)]">{name}</td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${!row ? 'badge-muted' : row.exists ? 'badge-cyan' : 'badge-muted'}`}>
                                {!row ? 'UNKNOWN' : row.exists ? 'PRESENT' : 'MISSING'}
                              </span>
                            </td>
                            <td className="py-2 pr-4 font-mono text-[var(--text-2)]">{row?.exists ? (row?.count ?? 0) : '—'}</td>
                            <td className="py-2 pr-4 font-mono text-[var(--text-2)]">{localRows ?? '—'}</td>
                            <td className="py-2">
                              {!row ? (
                                <span className="font-mono text-[10px] text-[var(--text-3)]">NOT PROBED</span>
                              ) : !row.exists ? (
                                <span className="font-mono text-[10px] text-[var(--text-3)]">AWAITING SCHEMA</span>
                              ) : (row?.count ?? 0) === (localRows ?? 0) ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--mint)]">
                                  <CheckCircle2 className="w-3 h-3" /> IN SYNC
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] text-[var(--amber)]">
                                  {row?.count ?? 0}/{localRows ?? 0} MIRRORED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live sample read back out of Supabase */}
              <div className="sd-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)] font-display">Live sample read from Supabase</h4>
                    <p className="text-xs text-[var(--text-3)] font-body">Fetched straight from Postgres with the service-role key — the read half of the integration.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sb-preview-table" className="text-[10px] font-mono uppercase text-[var(--text-3)]">Table</label>
                    <select
                      id="sb-preview-table"
                      value={sbPreviewTable}
                      onChange={(e) => setSbPreviewTable(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]"
                    >
                      {(sbStatus.setup.tables || []).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => loadPreview()} disabled={sbPreviewBusy} className="btn-secondary-pill">
                      <span className="inline-flex items-center gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${sbPreviewBusy ? 'animate-spin' : ''}`} /> Read
                      </span>
                    </button>
                  </div>
                </div>

                {!sbStatus.probe.ready ? (
                  <div className="p-4 text-center text-xs text-[var(--text-3)]">
                    Schema not applied yet — rows will be readable here once the tables exist and a sync has run.
                  </div>
                ) : sbPreviewBusy ? (
                  <div className="p-4 text-center text-xs text-[var(--text-3)]">
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Reading {sbPreviewTable} from Supabase…
                  </div>
                ) : sbPreview?.error ? (
                  <div className="p-4 text-center text-xs text-red-400">{sbPreview.error}</div>
                ) : (sbPreview?.rows?.length ?? 0) === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--text-3)]">
                    {sbPreviewTable} is empty in Supabase — press <strong className="text-[var(--text-2)]">Sync data now</strong> to mirror the local rows.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mono-eyebrow text-[9px]">
                      {sbPreviewTable} · showing {sbPreview.rows.length} of {sbPreview.count}
                    </div>
                    {sbPreview.rows.map((row, index) => (
                      <div key={row.id ?? index} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1 text-[11px] font-mono">
                          {Object.entries(row)
                            .slice(0, 9)
                            .map(([key, value]) => (
                              <div key={key} className="flex items-baseline justify-between gap-2 py-0.5">
                                <span className="text-[var(--text-3)] shrink-0">{key}</span>
                                <span className="text-[var(--text-2)] truncate text-right">
                                  {value === null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connection details */}
              <div className="sd-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)] font-display">Connection details</h4>
                    <p className="text-xs text-[var(--text-3)] font-body">Secrets stay server-side in <span className="font-mono">server/.env</span>; only the publishable key is exposed to the browser.</p>
                  </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {[
                    ['Project URL', sbStatus.env.url || 'not set'],
                    ['Project ref', supabaseProjectRef || '—'],
                    ['Publishable key', sbStatus.env.hasPublishableKey ? 'present (browser)' : 'not set'],
                    ['Secret key', sbStatus.env.hasSecretKey ? 'present (server only)' : 'not set'],
                    ['JWKS URL', sbStatus.env.jwks || 'not set'],
                    ['Postgres host', sbStatus.setup.host || 'not set'],
                    ['Postgres DSN var', sbStatus.setup.channels.dsnVar || 'not set'],
                    ['Background mirror', sbStatus.setup.mirrorIntervalMs ? `every ${Math.round(sbStatus.setup.mirrorIntervalMs / 1000)}s` : 'off'],
                    ['REST introspection', sbStatus.probe.reachable ? `HTTP ${sbStatus.probe.restStatus}` : 'unreachable'],
                    ['Browser check', sbBrowser?.message || 'checking…'],
                    ['Last probe', new Date(sbStatus.time).toLocaleString()]
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 py-1 border-b border-dashed border-[var(--line)]">
                      <dt className="text-[var(--text-3)] font-body shrink-0">{label}</dt>
                      <dd className="font-mono text-[var(--text-2)] truncate text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
        </div>
      )}

      <div className="sd-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-[var(--text)]">Platform Activity & Audit Stream</h3><p className="text-xs text-[var(--text-3)]">Monitor buyer and agency activity across tenants.</p></div><div className="flex items-center gap-2">{hiddenAuditIds.size > 0 && <button type="button" onClick={restoreAuditRows} className="shrink-0 rounded-lg border border-[var(--line-2)] px-2.5 py-2 text-[11px] text-[var(--text-2)] transition-colors hover:border-[var(--mint)] hover:text-[var(--mint)]">Restore {hiddenAuditIds.size} hidden</button>}<input value={auditQuery} onChange={e => setAuditQuery(e.target.value)} placeholder="Filter actor, action, target..." className="w-full sm:w-72 px-3 py-2 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" /></div></div>
        <div className="border border-[var(--line)] rounded-xl overflow-hidden divide-y divide-[var(--line)]">
          {filteredAuditLogs.map(log => (
            <div key={log.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 text-xs items-center">
              <div className="sm:col-span-2 font-mono text-[var(--text-3)]">{log.timestamp}</div>
              <div className="sm:col-span-2 font-semibold text-[var(--cyan)]">{log.actor}</div>
              <div className="sm:col-span-2 font-mono text-[var(--mint)]">{log.action}</div>
              <div className="sm:col-span-5 text-[var(--text-2)]">{log.details}</div>
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => hideAuditRow(log.id)}
                  title="Remove this audit row from the console"
                  aria-label={`Remove audit row ${log.id}`}
                  className="rounded-lg border border-[var(--line-2)] p-1.5 text-[var(--text-3)] transition-colors hover:border-[rgba(240,74,90,0.4)] hover:bg-[var(--red-dim)] hover:text-[var(--red)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {!filteredAuditLogs.length && (
            <div className="p-4 text-center text-xs text-[var(--text-3)]">No audit rows to show.</div>
          )}
        </div>
      </div>

      {isPlanModalOpen && (
        <div onClick={() => setIsPlanModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="sd-card max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] font-display">SaaS Plan Limits & Features</h2>
                <p className="text-xs text-[var(--text-3)]">Edit pricing, quotas and which role categories each plan unlocks for its buyers.</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} aria-label="Close plan manager" className="p-1.5 text-[var(--text-2)]"><X className="w-4 h-4" /></button>
            </div>

            {planMessage && (
              <div
                role="status"
                aria-live="polite"
                className={`px-3 py-2 rounded-xl border text-xs font-body ${
                  planMessage.type === 'error'
                    ? 'bg-[var(--red-dim)] border-[rgba(240,74,90,0.3)] text-[var(--red)]'
                    : 'bg-[var(--mint-dim)] border-[rgba(31,229,163,0.3)] text-[var(--mint)]'
                }`}
              >
                {planMessage.text}
              </div>
            )}

            {planDraft ? (
              <form onSubmit={savePlan} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="space-y-1">
                    <span className="text-[var(--text-2)]">Plan code</span>
                    <input
                      value={planDraft.id}
                      readOnly={!isNewPlan}
                      onChange={e => setPlanDraft({ ...planDraft, id: e.target.value.toUpperCase() })}
                      placeholder="e.g. STARTER"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono"
                    />
                  </label>
                  <label className="col-span-2 space-y-1">
                    <span className="text-[var(--text-2)]">Plan name</span>
                    <input value={planDraft.name} onChange={e => setPlanDraft({ ...planDraft, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" />
                  </label>
                  {[['price', 'Monthly price (PKR)'], ['roles', 'Seats / users'], ['branches', 'Maximum branches'], ['storageGB', 'Vault storage (GB)'], ['sortOrder', 'Display order']].map(([key, label]) => (
                    <label key={key} className="space-y-1">
                      <span className="text-[var(--text-2)]">{label}</span>
                      <input
                        type="number"
                        value={planDraft[key]}
                        onChange={e => setPlanDraft({ ...planDraft, [key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono"
                      />
                    </label>
                  ))}
                  <label className="col-span-2 sm:col-span-3 space-y-1">
                    <span className="text-[var(--text-2)]">Features and functionality</span>
                    <input value={planDraft.features} onChange={e => setPlanDraft({ ...planDraft, features: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" />
                  </label>
                  <label className="col-span-2 sm:col-span-3 space-y-1">
                    <span className="text-[var(--text-2)]">Short description</span>
                    <input value={planDraft.description} onChange={e => setPlanDraft({ ...planDraft, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" />
                  </label>
                </div>

                <fieldset className="space-y-2 border-t border-[var(--line)] pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-[var(--text)]">Role categories on this plan</span>
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">The policy engine checks this allow-list on sign-in, registration and every plan change.</p>
                    </div>
                    <span className="badge-cyan px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">
                      {(planDraft.allowedRoles || []).length}/9
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TENANT_ROLES.map(role => {
                      const checked = (planDraft.allowedRoles || []).includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-[var(--mint-dim)] border-[rgba(31,229,163,0.3)]'
                              : 'bg-[var(--surface-2)] border-[var(--line)] hover:border-[var(--line-2)]'
                          }`}
                        >
                          <input type="checkbox" checked={checked} onChange={() => togglePlanRole(role.id)} className="accent-[var(--mint)] shrink-0" />
                          <span className="min-w-0">
                            <span className={`block text-[11px] font-semibold truncate ${checked ? 'text-[var(--mint)]' : 'text-[var(--text-2)]'}`}>{role.label}</span>
                            <span className="block text-[9px] font-mono text-[var(--text-3)] truncate">{role.id}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                  <label className="flex items-center gap-2 text-[var(--text-2)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planDraft.isActive !== false}
                      onChange={e => setPlanDraft({ ...planDraft, isActive: e.target.checked })}
                      className="accent-[var(--mint)]"
                    />
                    Accepting new buyers
                  </label>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {!isNewPlan && (
                      <>
                        <button
                          type="button"
                          onClick={() => duplicatePlan(plans.find(plan => plan.id === planDraft.id) || planDraft)}
                          className="btn-secondary-pill"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePlan(plans.find(plan => plan.id === planDraft.id) || planDraft)}
                          disabled={planBusy}
                          className="btn-secondary-pill"
                          style={{ color: 'var(--red)' }}
                        >
                          Delete plan
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => setPlanDraft(null)} className="btn-secondary-pill">Back to plans</button>
                    <button type="submit" disabled={planBusy} className="btn-primary-pill">
                      {planBusy ? 'Saving…' : isNewPlan ? 'Create plan' : 'Save plan configuration'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {plans.map(plan => (
                  <div key={plan.id} className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center gap-3">
                    <button type="button" onClick={() => openPlanEditor(plan)} className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <strong className="truncate">{plan.name}</strong>
                        <span className="font-mono shrink-0">PKR {Number(plan.price).toLocaleString()}</span>
                      </div>
                      <div className="text-[var(--text-3)] mt-1">
                        {plan.roles} seats · {plan.branches} branches · {plan.storageGB} GB storage · {(plan.allowedRoles || []).length || TENANT_ROLES.length} role categories · {plan.buyers ?? 0} buyers
                      </div>
                      <div className="text-[var(--text-3)] text-[11px] mt-0.5 truncate">{plan.features}</div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${plan.isActive === false ? 'badge-muted' : 'badge-mint'}`}>
                        {plan.isActive === false ? 'PAUSED' : 'ACTIVE'}
                      </span>
                      <button type="button" onClick={() => togglePlanActive(plan)} className="btn-secondary-pill">
                        {plan.isActive === false ? 'Reopen' : 'Pause'}
                      </button>
                      <button type="button" onClick={() => duplicatePlan(plan)} className="btn-secondary-pill">Duplicate</button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={openNewPlan}
                  className="w-full py-2 rounded-lg border border-dashed border-[var(--line-2)] text-[var(--text-2)] hover:text-[var(--mint)] hover:border-[var(--mint)] transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> New plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isAgencyModalOpen && selectedOrg && (
        <div onClick={() => setIsAgencyModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form onSubmit={saveAgency} onClick={e => e.stopPropagation()} className="sd-card max-w-xl w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--text)]">Edit Agency Tenant</h2>
            {orgMessage && (
              <div
                role="status"
                aria-live="polite"
                className="px-3 py-2 rounded-xl border text-xs font-body bg-[var(--red-dim)] border-[rgba(240,74,90,0.3)] text-[var(--red)]"
              >
                {orgMessage.text}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[['name', 'Agency name'], ['ownerName', 'Owner name'], ['email', 'Owner email'], ['phone', 'Phone'], ['headquarters', 'Headquarters'], ['dtsLicense', 'DTS license'], ['branchesCount', 'Branches'], ['usersCount', 'Users']].map(([key, label]) => (
                <label key={key} className="space-y-1">
                  <span className="text-[var(--text-2)]">{label}</span>
                  <input value={selectedOrg[key]} onChange={e => setSelectedOrg({ ...selectedOrg, [key]: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAgencyModalOpen(false)} className="btn-secondary-pill">Cancel</button>
              <button type="submit" disabled={orgBusy} className="btn-primary-pill">{orgBusy ? 'Saving…' : 'Save agency info'}</button>
            </div>
          </form>
        </div>
      )}

      {isOwnerWhatsAppOpen && <div onClick={() => setIsOwnerWhatsAppOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"><div onClick={e => e.stopPropagation()} className="sd-card max-w-2xl w-full p-6 space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#25D366]" /> Owner WhatsApp Hub</h2><p className="text-xs text-[var(--text-3)]">Platform support, onboarding and agency-wide announcements.</p></div><button onClick={() => setIsOwnerWhatsAppOpen(false)} className="p-1.5 text-[var(--text-2)]"><X className="w-4 h-4" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button className="p-4 text-left rounded-xl border border-[var(--line)] bg-[var(--surface-2)]"><strong className="text-sm">Broadcast to agencies</strong><p className="text-xs text-[var(--text-3)] mt-1">Send a platform update to active SaaS buyers.</p></button><button className="p-4 text-left rounded-xl border border-[var(--line)] bg-[var(--surface-2)]"><strong className="text-sm">Open support queue</strong><p className="text-xs text-[var(--text-3)] mt-1">Review onboarding and billing conversations.</p></button></div><div className="border border-[var(--line)] rounded-xl divide-y divide-[var(--line)]"><div className="p-3 text-xs"><strong>Karakoram Express Travel</strong><span className="float-right text-[#25D366]">Active</span><p className="text-[var(--text-3)] mt-1">Requested an additional operations seat</p></div><div className="p-3 text-xs"><strong>Al-Buraq Executive Umrah Services</strong><span className="float-right text-[var(--amber)]">Needs reply</span><p className="text-[var(--text-3)] mt-1">Subscription renewal assistance</p></div></div></div></div>}

      {/* Provision New Agency Modal */}
      {isNewOrgModalOpen && (
        <div 
          onClick={() => setIsNewOrgModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="sd-card max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] font-display">Provision New Agency Tenant</h2>
                <p className="text-xs text-[var(--text-3)] font-body">Create isolated PostgreSQL tenant partition & administrator</p>
              </div>
              <button 
                onClick={() => setIsNewOrgModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs font-body">
              {orgMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  className="px-3 py-2 rounded-xl border text-xs bg-[var(--red-dim)] border-[rgba(240,74,90,0.3)] text-[var(--red)]"
                >
                  {orgMessage.text}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Agency Legal Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Shalimar Holidays & Visa Consultancy"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">CEO / Owner Name</label>
                  <input
                    type="text"
                    required
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Chaudhry Tariq"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Owner Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="tariq@shalimar.com"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">DTS License No</label>
                  <input
                    type="text"
                    required
                    value={newDts}
                    onChange={(e) => setNewDts(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Subscription Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)] font-mono"
                  >
                    {plans.filter(plan => plan.isActive !== false).map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (PKR {Number(plan.price).toLocaleString()}/mo · {plan.roles} seats · {(plan.allowedRoles || []).length || TENANT_ROLES.length} roles)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrgModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orgBusy}
                  className="btn-primary-pill px-5 py-2 text-xs"
                >
                  {orgBusy ? 'Provisioning…' : 'Provision Agency Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
