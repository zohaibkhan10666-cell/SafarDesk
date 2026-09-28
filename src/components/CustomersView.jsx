import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Eye, 
  EyeOff, 
  Clock, 
  Plane, 
  CreditCard,
  X
} from 'lucide-react';

export default function CustomersView({ customers, setCustomers, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0] || null);
  const [maskSensitive, setMaskSensitive] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Won leads land here automatically (README §5 · §6) — keep the selection valid
  // while the list refreshes.
  useEffect(() => {
    if (!customers.length) {
      setSelectedCustomer(null);
      return;
    }
    setSelectedCustomer(current =>
      current && customers.some(c => c.id === current.id) ? current : customers[0]
    );
  }, [customers]);

  const isWonLead = (c) => Boolean(c && (c.leadId || c.customerType === 'Won Lead'));
  const wonCount = customers.filter(isWonLead).length;

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.cnic || '').includes(q);
    const matchesSource =
      sourceFilter === 'ALL' ||
      (sourceFilter === 'WON' && isWonLead(c)) ||
      (sourceFilter === 'DIRECT' && !isWonLead(c));
    return matchesSearch && matchesSource;
  });

  const formatCNIC = (cnic) => {
    if (!cnic) return '—';
    if (!maskSensitive) return cnic;
    // Mask middle digits: 35201-*******-1
    return cnic.replace(/-\d{7}-/, '-*******-');
  };

  const formatPassport = (p) => {
    if (!maskSensitive) return p;
    // Mask middle: AL***043
    if (!p || p.length < 5) return p;
    return `${p.substring(0, 2)}***${p.substring(p.length - 3)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Customers & Traveller Profiles
          </h1>
          <p className="text-xs text-[var(--color-body)]">
            Verified CNIC traveler directory, lifetime customer accounts, and automated passport validity alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {wonCount > 0 && (
            <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-500/40 bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {wonCount} won from Leads CRM
            </span>
          )}
          {/* Sensitive Data Masking Toggle */}
          <button
            onClick={() => setMaskSensitive(!maskSensitive)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] hover:bg-[var(--color-hairline-soft)] text-[var(--color-ink)] transition-colors"
          >
            {maskSensitive ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
            <span>{maskSensitive ? 'Data Masked (GDPR)' : 'Show Full Passports/CNIC'}</span>
          </button>
        </div>
      </div>

      {/* Main Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Column (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--color-mute)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, CNIC, phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-md text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Customer source filter">
            {[
              { id: 'ALL', label: `All (${customers.length})` },
              { id: 'WON', label: `Won from leads (${wonCount})` },
              { id: 'DIRECT', label: `Direct (${customers.length - wonCount})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSourceFilter(f.id)}
                aria-pressed={sourceFilter === f.id}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                  sourceFilter === f.id
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600'
                    : 'border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-mute)] hover:text-[var(--color-ink)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              // Check for passport warnings
              const hasExpiringSoon = c.travellers?.some(t => t.daysUntilPassportExpiry <= 180);
              const hasUrgentExpiry = c.travellers?.some(t => t.daysUntilPassportExpiry <= 30);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'border-[var(--color-ink)] bg-[var(--color-canvas-elevated)] shadow-xs'
                      : 'border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] hover:border-[var(--color-mute)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-[var(--color-ink)]">{c.name}</span>
                    <span className="flex items-center gap-1">
                      {isWonLead(c) && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-emerald-500/40 bg-emerald-500/15 text-emerald-600"
                          title={c.leadId ? `Converted from won lead ${c.leadId}` : 'Converted from Leads CRM'}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" /> Won
                        </span>
                      )}
                      {c.customerType && (
                        <span className="mono-eyebrow text-[9px] px-1.5 py-0.2 rounded bg-[var(--color-hairline-soft)]">
                          {c.customerType}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--color-mute)] flex justify-between font-mono">
                    <span>{c.phone}</span>
                    <span>{c.city}</span>
                  </div>

                  {/* Warning tags */}
                  {hasUrgentExpiry ? (
                    <div className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span>Passport Expiring in &lt;30 Days!</span>
                    </div>
                  ) : hasExpiringSoon ? (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Passport Expiring in &lt;180 Days</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane (8 cols) */}
        {selectedCustomer ? (
          <div className="lg:col-span-8 hairline-card p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-hairline)]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">{selectedCustomer.name}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedCustomer.customerType}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-body)] mt-1 flex flex-wrap gap-3">
                  <span>CNIC: <strong className="font-mono text-[var(--color-ink)]">{formatCNIC(selectedCustomer.cnic)}</strong></span>
                  <span>•</span>
                  <span>WhatsApp: <strong className="font-mono">{selectedCustomer.phone}</strong></span>
                  <span>•</span>
                  <span>City: <strong>{selectedCustomer.city || '—'}</strong></span>
                </div>
                {isWonLead(selectedCustomer) && (
                  <div role="status" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Won lead{selectedCustomer.leadId ? ` ${selectedCustomer.leadId}` : ''} converted automatically
                    {selectedCustomer.wonAt ? ` · ${selectedCustomer.wonAt}` : ''}
                  </div>
                )}
              </div>

              {/* Lifetime stats pill */}
              <div className="flex items-center gap-3 bg-[var(--color-hairline-soft)] p-2.5 rounded-lg text-xs">
                <div>
                  <div className="text-[10px] text-[var(--color-mute)]">Total Spend</div>
                  <div className="font-semibold font-mono text-[var(--color-ink)]">
                    PKR {(((selectedCustomer.lifetimeSpendPKR || 0) / 1000) || 0).toFixed(0)}k
                  </div>
                </div>
                <div className="border-l border-[var(--color-hairline)] pl-3">
                  <div className="text-[10px] text-[var(--color-mute)]">Outstanding</div>
                  <div className={`font-semibold font-mono ${(selectedCustomer.outstandingBalancePKR || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    PKR {(selectedCustomer.outstandingBalancePKR || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Travellers & Passport Expiry Radar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-link)]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                    Linked Travellers & Passport Validity
                  </h3>
                </div>
                <span className="text-[11px] text-[var(--color-mute)]">
                  {selectedCustomer.travellers?.length || 0} Registered Travellers
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedCustomer.travellers?.map((trv) => {
                  const isExpiringUrgent = trv.daysUntilPassportExpiry <= 30;
                  const isExpiringWarning = trv.daysUntilPassportExpiry <= 180 && !isExpiringUrgent;

                  return (
                    <div 
                      key={trv.id}
                      className="p-3.5 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs text-[var(--color-ink)] flex items-center gap-2">
                            <span>{trv.fullName}</span>
                            <span className="text-[10px] font-normal text-[var(--color-mute)]">({trv.relation})</span>
                          </div>
                          <div className="text-[11px] text-[var(--color-mute)] font-mono mt-0.5">
                            DOB: {trv.dob} · CNIC: {formatCNIC(trv.cnic)} · Gender: {trv.gender}
                          </div>
                        </div>

                        {/* Passport Expiry Pill */}
                        <div className="text-right">
                          <div className="text-[11px] font-mono font-medium text-[var(--color-ink)]">
                            Passport: {formatPassport(trv.passportNumber)}
                          </div>
                          <div className="text-[10px] text-[var(--color-mute)]">
                            Expires: <span className="font-mono">{trv.passportExpiryDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expiry Warning Callout */}
                      {isExpiringUrgent && (
                        <div className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            <strong>Critical Warning:</strong> Passport expires in <strong>{trv.daysUntilPassportExpiry} days</strong>. International travel requires min 6 months validity.
                          </span>
                        </div>
                      )}

                      {isExpiringWarning && (
                        <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[11px]">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            <strong>Advisory:</strong> Passport expires in <strong>{trv.daysUntilPassportExpiry} days</strong> (&lt;180 days). Recommend renewal before long-haul visa submission.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions for this customer */}
            <div className="pt-4 border-t border-[var(--color-hairline)] flex flex-wrap gap-2.5">
              <button
                onClick={() => onNavigate('visa')}
                className="btn-ghost-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Active Visa Cases</span>
              </button>
              <button
                onClick={() => onNavigate('quotations')}
                className="btn-ghost-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Generate Quotation</span>
              </button>
              <button
                onClick={() => onNavigate('bookings')}
                className="btn-ghost-sm"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>View Bookings & Itineraries</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 hairline-card p-12 text-center text-xs text-[var(--color-mute)]">
            Select a customer profile to view complete travel history and passenger details.
          </div>
        )}
      </div>
    </div>
  );
}
