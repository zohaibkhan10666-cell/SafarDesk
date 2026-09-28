import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Building, 
  CreditCard, 
  Users, 
  Check, 
  Globe, 
  MapPin, 
  History, 
  Sparkles, 
  Clock, 
  Search, 
  X, 
  Plus, 
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { 
  initialAgencyData, 
  initialUsers, 
  initialAuditLogs 
} from '../data/mockData';
import { api } from '../lib/api';

/** Platform plan catalog (README §19.1) → the card shape this view renders. */
function planCardsFromCatalog(catalog, currentPlanId) {
  return catalog.map(plan => ({
    id: plan.id,
    name: plan.name,
    pricePKR: `${Number(plan.price).toLocaleString()} / mo`,
    limits: `${plan.roles} seats · ${plan.branches} branch${plan.branches === 1 ? '' : 'es'} · ${plan.storageGB} GB vault`,
    features: String(plan.features || '')
      .split(',')
      .map(feature => feature.trim())
      .filter(Boolean),
    popular: plan.id === currentPlanId,
    allowedRoles: plan.allowedRoles
  }));
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('agency'); // 'agency', 'branches', 'currencies', 'audit', 'plans'
  const [agencyData, setAgencyData] = useState(initialAgencyData);
  const [currencies, setCurrencies] = useState(initialAgencyData.currencies);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [selectedPlan, setSelectedPlan] = useState('AGENCY_PRO');
  const [catalogPlans, setCatalogPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState('AGENCY_PRO');
  const [planStatus, setPlanStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.entitlements.get()
      .then(data => {
        if (cancelled) return;
        if (Array.isArray(data?.catalog) && data.catalog.length) {
          setCatalogPlans(planCardsFromCatalog(data.catalog, data.plan?.id));
        }
        if (data?.plan?.id) {
          setCurrentPlanId(data.plan.id);
          setSelectedPlan(data.plan.id);
        }
      })
      .catch(() => {
        // Offline / older API — the bundled plan cards stay on screen.
      });
    return () => { cancelled = true; };
  }, []);

  const requestPlanChange = async (planId) => {
    setPlanStatus(null);
    try {
      const result = await api.entitlements.requestPlan(planId);
      setPlanStatus({ type: 'ok', text: result?.message || 'Plan change requested.' });
    } catch (error) {
      setPlanStatus({ type: 'error', text: error.message });
    }
  };

  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Audit filter state
  const [auditSearch, setAuditSearch] = useState('');

  const plans = [
    {
      id: 'STARTER',
      name: 'Agency Starter',
      pricePKR: '18,000 / mo',
      limits: '3 Users · 1 Branch · 500 Leads/mo',
      features: ['WhatsApp Direct Click-to-Chat', 'Visa Checklists', 'Basic Quotations']
    },
    {
      id: 'BUSINESS',
      name: 'Business Growth',
      pricePKR: '42,000 / mo',
      limits: '10 Users · 2 Branches · Unlimited Leads',
      features: ['Full Document Vault', 'Multi-currency (PKR, SAR, AED, USD)', 'Payment Installment Ledger', 'Branch Scoping']
    },
    {
      id: 'AGENCY_PRO',
      name: 'Agency Enterprise Pro',
      pricePKR: '85,000 / mo',
      popular: true,
      limits: 'Unlimited Users · Multi-Branch · Priority Support',
      features: [
        'All Core Modules Included',
        'Custom Domain & White-labeling',
        'Direct WhatsApp Cloud API Webhooks',
        'Dedicated PostgreSQL Tenant Database',
        'Full Audit Logging & RBAC Matrix'
      ]
    }
  ];

  const filteredLogs = auditLogs.filter(log => 
    log.actor.toLowerCase().includes(auditSearch.toLowerCase()) || 
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
    log.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const handleUpdateRate = (code, newRate) => {
    setCurrencies(currencies.map(c => c.code === code ? { ...c, rateToPKR: parseFloat(newRate) || c.rateToPKR } : c));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              Agency Governance, Settings & SaaS Plan
            </h1>
            <span className="badge-mint text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              README §3, §26, §29
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Legal DTS entity profile, branch allocations, multi-currency exchange matrix, audit logs, and onboarding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setOnboardingStep(1);
              setIsOnboardingModalOpen(true);
            }}
            className="btn-primary-pill shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Onboarding Wizard</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] overflow-x-auto">
        {[
          { id: 'agency', label: 'Legal Entity Profile' },
          { id: 'branches', label: `Branch Allocation (${agencyData.branches.length})` },
          { id: 'currencies', label: 'Multi-Currency Matrix' },
          { id: 'audit', label: `Audit Log Trail (${auditLogs.length})` },
          { id: 'plans', label: 'SaaS Subscription Plan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Legal Entity Profile */}
      {activeTab === 'agency' && (
        <div className="sd-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-display">
                Registered Pakistani Travel Agency Profile
              </h3>
              <p className="text-xs text-[var(--text-3)] font-body">
                Official Department of Tourist Services (DTS) and IATA accreditation credentials
              </p>
            </div>
            <ShieldCheck className="w-6 h-6 text-[var(--mint)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-body">
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
              <span className="mono-eyebrow text-[9.5px]">Official Registered Name</span>
              <div className="font-bold text-sm text-[var(--text)] font-display">{agencyData.name}</div>
              <div className="text-[11px] text-[var(--text-3)]">{agencyData.tagline}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
              <span className="mono-eyebrow text-[9.5px]">DTS Accreditation & License</span>
              <div className="font-mono font-bold text-sm text-[var(--mint)]">{agencyData.licenseNumber}</div>
              <div className="text-[11px] text-[var(--text-3)]">Licensed Outbound Tour Operator & Visa Agent</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
              <span className="mono-eyebrow text-[9.5px]">Headquarters Address</span>
              <div className="text-[var(--text)] font-medium">{agencyData.headquarters}</div>
              <div className="text-[11px] text-[var(--text-3)]">Corporate Head Office, Punjab, Pakistan</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
              <span className="mono-eyebrow text-[9.5px]">Official Communication Channels</span>
              <div className="font-mono text-[var(--text)]">{agencyData.phone} · WhatsApp: {agencyData.whatsapp}</div>
              <div className="text-[11px] text-[var(--cyan)] font-mono">{agencyData.email}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--mint)]">
              <CreditCard className="w-4 h-4" />
              <span>Corporate Bank Accounts for Raast & Client Wire Transfers</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                <div className="font-semibold text-[var(--text)]">Meezan Bank Limited (Islamic Banking)</div>
                <div className="font-mono text-[11px] text-[var(--mint)] mt-0.5">IBAN: PK64MEZN0099200109281720</div>
                <div className="text-[10px] text-[var(--text-3)]">Raast ID Registered: +92 300 8472910</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                <div className="font-semibold text-[var(--text)]">Habib Bank Limited (HBL Corporate)</div>
                <div className="font-mono text-[11px] text-[var(--cyan)] mt-0.5">IBAN: PK36HABB0001298471928019</div>
                <div className="text-[10px] text-[var(--text-3)]">Branch: Main Market Gulberg, Lahore</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Branch Allocation */}
      {activeTab === 'branches' && (
        <div className="sd-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-display">
                Multi-Branch Office Network
              </h3>
              <p className="text-xs text-[var(--text-3)] font-body">
                Isolated team access, assigned branch managers, and operational quotas
              </p>
            </div>
            <Building className="w-6 h-6 text-[var(--cyan)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyData.branches.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--mint)]" />
                    <h4 className="font-bold text-sm text-[var(--text)] font-display">{b.name}</h4>
                  </div>
                  <span className="mono-eyebrow text-[9px] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--line)]">
                    {b.id}
                  </span>
                </div>

                <div className="text-xs text-[var(--text-2)] space-y-1 font-body">
                  <div>Branch Manager: <strong className="text-[var(--text)]">{b.manager}</strong></div>
                  <div className="font-mono text-[11px] text-[var(--text-3)]">{b.phone}</div>
                </div>

                <div className="pt-2 border-t border-[var(--line)] flex justify-between items-center text-xs font-mono">
                  <span className="text-[var(--cyan)]">{b.activeLeads} Active Leads</span>
                  <span className="text-[var(--text-3)]">{b.totalStaff} Assigned Staff</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Multi-Currency Exchange Matrix */}
      {activeTab === 'currencies' && (
        <div className="sd-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-display">
                Operational Currencies & Exchange Rates (PKR Baseline)
              </h3>
              <p className="text-xs text-[var(--text-3)] font-body">
                Configure conversion rates for Umrah SAR packages, Dubai AED visas, and USD hotel bookings
              </p>
            </div>
            <Globe className="w-6 h-6 text-[var(--mint)]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {currencies.map(c => (
              <div key={c.code} className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-2 text-center">
                <div className="font-bold text-sm text-[var(--text)] font-display">{c.code} ({c.symbol})</div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-3)] font-mono">Rate in PKR</label>
                  {c.isDefault ? (
                    <div className="font-mono font-bold text-xs text-[var(--mint)] py-1 bg-[var(--surface)] rounded border border-[var(--line)]">
                      1.00 (Base)
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      value={c.rateToPKR}
                      onChange={(e) => handleUpdateRate(c.code, e.target.value)}
                      className="w-full text-center py-1 text-xs font-mono font-bold bg-[var(--surface)] border border-[var(--line-2)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Log Trail */}
      {activeTab === 'audit' && (
        <div className="sd-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-display">
                Immutable Operational & Security Audit Trail
              </h3>
              <p className="text-xs text-[var(--text-3)] font-body">
                Tamper-resistant log tracking staff transactions, status modifications, and payment verifications (README §29)
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter logs by actor, action..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--line-2)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--mint)]"
              />
            </div>
          </div>

          <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-body divide-y divide-[var(--line)]">
            <div className="grid grid-cols-12 p-3 font-semibold text-[var(--text-3)] bg-[var(--surface-2)]">
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-2">Staff Member / Role</div>
              <div className="col-span-2">Action Type</div>
              <div className="col-span-4">Operation Details</div>
              <div className="col-span-2 text-right">Branch / IP</div>
            </div>

            {filteredLogs.map(log => (
              <div key={log.id} className="grid grid-cols-12 p-3 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                <div className="col-span-2 font-mono text-[11px] text-[var(--text-3)]">
                  {log.timestamp}
                </div>
                <div className="col-span-2">
                  <div className="font-semibold text-[var(--text)]">{log.actor}</div>
                  <div className="text-[10px] text-[var(--cyan)] font-mono">{log.role}</div>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[var(--surface-2)] text-[var(--mint)] border border-[var(--line-2)]">
                    {log.action}
                  </span>
                </div>
                <div className="col-span-4 text-[var(--text-2)]">
                  {log.details}
                  <span className="font-mono text-[10px] text-[var(--cyan)] block mt-0.5">Ref: {log.target}</span>
                </div>
                <div className="col-span-2 text-right font-mono text-[10px] text-[var(--text-3)]">
                  <div>{log.branch}</div>
                  <div>IP: {log.ip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: SaaS Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(catalogPlans.length ? catalogPlans : plans).map((p) => {
              const isCurrent = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`sd-card p-5 space-y-4 relative cursor-pointer transition-all ${
                    isCurrent ? 'border-[var(--mint)] shadow-md' : 'hover:border-[var(--line-2)]'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[var(--mint)] text-black text-[10px] font-bold tracking-wide">
                      ACTIVE TIER
                    </span>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-[var(--text)] font-display">{p.name}</h4>
                    <div className="text-xl font-bold font-mono text-[var(--mint)] mt-1">{p.pricePKR}</div>
                    <p className="text-[11px] text-[var(--text-3)] mt-1">{p.limits}</p>
                  </div>

                  <div className="space-y-2 text-xs border-t border-[var(--line)] pt-3 font-body">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[var(--text-2)]">
                        <Check className="w-3.5 h-3.5 text-[var(--mint)] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isCurrent) {
                        setPlanStatus({ type: 'ok', text: `${p.name} is already the active tier for this agency.` });
                      } else {
                        requestPlanChange(p.id);
                      }
                    }}
                    className={`w-full py-2 text-xs font-semibold rounded-xl transition-colors ${
                      isCurrent ? 'btn-primary-pill justify-center' : 'btn-ghost-sm justify-center'
                    }`}
                  >
                    {isCurrent ? 'Current Active Tier' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>

          <div
            role="status"
            aria-live="polite"
            className={`text-xs font-body px-3 py-2 rounded-xl border ${
              planStatus
                ? planStatus.type === 'error'
                  ? 'bg-[var(--red-dim)] border-[rgba(240,74,90,0.3)] text-[var(--red)]'
                  : 'bg-[var(--mint-dim)] border-[rgba(31,229,163,0.3)] text-[var(--mint)]'
                : 'border-dashed border-[var(--line)] text-[var(--text-3)]'
            }`}
          >
            {planStatus
              ? planStatus.text
              : 'Plan changes are requested from the platform owner — the Super Admin console applies the new price, quotas and role access.'}
          </div>
        </div>
      )}

      {/* Onboarding Wizard Modal */}
      {isOnboardingModalOpen && (
        <div 
          onClick={() => setIsOnboardingModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="sd-card max-w-xl w-full p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono-eyebrow text-[10px] text-[var(--mint)]">Step {onboardingStep} of 4</span>
                  <span className="badge-cyan text-[9px] px-2 py-0.2 rounded font-mono">README §3</span>
                </div>
                <h2 className="text-base font-bold text-[var(--text)] font-display mt-0.5">
                  SafarDesk Agency Setup Wizard
                </h2>
              </div>
              <button 
                onClick={() => setIsOnboardingModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Agency Legal Name & License */}
            {onboardingStep === 1 && (
              <div className="space-y-4 text-xs font-body">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Agency Name</label>
                  <input
                    type="text"
                    defaultValue={agencyData.name}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">DTS License / Accreditation</label>
                  <input
                    type="text"
                    defaultValue={agencyData.licenseNumber}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Currency & Timezone */}
            {onboardingStep === 2 && (
              <div className="space-y-4 text-xs font-body">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Default Currency</label>
                  <select className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)] font-mono">
                    <option value="PKR">Pakistani Rupee (PKR - ₨)</option>
                    <option value="SAR">Saudi Riyal (SAR - ﷼)</option>
                    <option value="USD">US Dollar (USD - $)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Timezone</label>
                  <input
                    type="text"
                    readOnly
                    value="Asia/Karachi (GMT+5)"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text-3)] font-mono"
                  />
                </div>
              </div>
            )}

            {/* Step 3: First Office Branch */}
            {onboardingStep === 3 && (
              <div className="space-y-4 text-xs font-body">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Principal Headquarters Branch</label>
                  <input
                    type="text"
                    defaultValue="Lahore HQ (Gulberg III)"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Designated Branch Manager</label>
                  <input
                    type="text"
                    defaultValue="Bilal Ahmed"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Verification & Complete */}
            {onboardingStep === 4 && (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--mint-dim)] border border-[rgba(31,229,163,0.3)] flex items-center justify-center text-[var(--mint)] mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text)] font-display">Agency Tenant Successfully Verified!</h3>
                <p className="text-xs text-[var(--text-2)] max-w-sm mx-auto font-body">
                  Your tenant database partition, role permissions, and branch scoping have been initialized.
                </p>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-[var(--line)] flex justify-between items-center">
              {onboardingStep > 1 && onboardingStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-2)] hover:text-[var(--text)]"
                >
                  Previous
                </button>
              ) : <div />}

              {onboardingStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                  className="btn-primary-pill px-5 py-2 text-xs flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="btn-primary-pill px-6 py-2 text-xs"
                >
                  Complete & Return to Workspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
