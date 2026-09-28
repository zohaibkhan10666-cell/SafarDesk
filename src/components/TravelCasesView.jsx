import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Search, 
  Plus, 
  User, 
  Users, 
  FileText, 
  Plane, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  MessageSquare, 
  Calendar, 
  Hotel, 
  Car, 
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export default function TravelCasesView({ travelCases, setTravelCases, currentRole, currentBranch, onOpenWhatsApp }) {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseTab, setCaseTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCases(travelCases);
    setSelectedCase(travelCases[0] || null);
  }, [travelCases]);

  const setCasesWithSync = (updater) => {
    const newCases = typeof updater === 'function' ? updater(cases) : updater;
    setCases(newCases);
    setTravelCases(newCases);
  };

  // Role permissions check per README §15
  const canSeeInternalCosts = currentRole === 'SUPER_ADMIN' || currentRole === 'AGENCY_OWNER' || currentRole === 'ACCOUNTANT';

  // Branch filtering
  const filteredCases = cases.filter(c => {
    const matchesBranch = currentBranch?.id === 'ALL' || !currentBranch?.id || c.branchId === currentBranch.id;
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.id.toLowerCase().includes(q) || 
                          c.customerName.toLowerCase().includes(q) || 
                          c.destination.toLowerCase().includes(q);
    return matchesBranch && matchesSearch;
  });

  const stages = ['Lead', 'Quote', 'Docs', 'Visa', 'Booking', 'Travel', 'Complete'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              Travel Case 360° Command Center
            </h1>
            <span className="badge-mint text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              README §16 (Core SaaS Object)
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Single operational truth uniting Customer → Travellers → Visa → Docs → Quotation → Booking → Payments → Timeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCase && (
            <button
              onClick={() => onOpenWhatsApp?.(selectedCase.customerName, selectedCase.phone, { destination: selectedCase.destination })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#25D366] text-black hover:bg-[#20ba59] transition-all shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Case Update</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Cases Queue (4 cols), Right Case 360 Workspace (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Cases Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID, client, destination..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--line-2)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--mint)]"
            />
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {filteredCases.map(c => {
              const isSelected = selectedCase?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-[var(--mint)] bg-[var(--surface-2)] shadow-md shadow-[rgba(0,0,0,0.3)]'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-2)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="mono-eyebrow text-[9.5px] text-[var(--mint)]">{c.id}</span>
                      <h4 className="font-semibold text-xs text-[var(--text)] font-display mt-0.5">{c.customerName}</h4>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.25)]">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--text-2)] font-body">
                    <div>{c.destination} ({c.travellers?.length} Pax)</div>
                    <div className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">
                      Consultant: {c.assignedConsultant} · Visa: {c.visaOfficer}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[var(--line)] font-mono">
                    <span className="text-[var(--text-3)]">Balance Due:</span>
                    <span className={c.payment.balancePKR > 0 ? 'text-[var(--red)] font-bold' : 'text-[var(--mint)]'}>
                      {c.payment.balancePKR > 0 ? `PKR ${c.payment.balancePKR.toLocaleString()}` : 'Fully Cleared'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 360° Workspace */}
        <div className="lg:col-span-8">
          {selectedCase ? (
            <div className="sd-card p-6 space-y-6">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--mint)]">{selectedCase.id}</span>
                    <span className="mono-eyebrow text-[9.5px] text-[var(--cyan)]">{selectedCase.destination}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text)] font-display mt-1">
                    {selectedCase.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-2)] mt-1.5">
                    <div>Client: <strong>{selectedCase.customerName}</strong> ({selectedCase.phone})</div>
                    <div>Branch: <strong className="text-[var(--text)]">{selectedCase.branchId}</strong></div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] mono-eyebrow text-[var(--text-3)]">Total Value</span>
                  <div className="text-lg font-bold font-mono text-[var(--text)]">
                    PKR {selectedCase.quote.totalAmountPKR.toLocaleString()}
                  </div>
                  {canSeeInternalCosts && (
                    <div className="text-[10px] text-[var(--mint)] font-mono">
                      Profit: PKR {selectedCase.quote.grossProfitPKR.toLocaleString()} ({selectedCase.quote.marginPct})
                    </div>
                  )}
                </div>
              </div>

              {/* 7-Step Visual Pipeline Stepper */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                <div className="flex items-center justify-between overflow-x-auto text-[10px] font-mono">
                  {stages.map((stage, idx) => {
                    const isPassed = idx < selectedCase.stageIndex;
                    const isCurrent = idx === selectedCase.stageIndex;

                    return (
                      <div key={stage} className="flex items-center gap-1.5 shrink-0 px-2 py-1">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isPassed ? 'bg-[var(--mint)] text-black' :
                          isCurrent ? 'bg-[var(--cyan)] text-black ring-2 ring-[var(--cyan-dim)] animate-pulse' :
                          'bg-[var(--surface-3)] text-[var(--text-3)]'
                        }`}>
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span className={isCurrent ? 'text-[var(--cyan)] font-bold' : isPassed ? 'text-[var(--text)]' : 'text-[var(--text-3)]'}>
                          {stage}
                        </span>
                        {idx < stages.length - 1 && <ChevronRight className="w-3 h-3 text-[var(--line-2)] ml-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Internal 360 Tabs Navigation */}
              <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2 overflow-x-auto text-xs">
                {[
                  { id: 'overview', label: '360° Overview' },
                  { id: 'travellers', label: `Travellers (${selectedCase.travellers.length})` },
                  { id: 'visa', label: 'Visa Tracking' },
                  { id: 'docs', label: `Vault Documents (${selectedCase.documents.length})` },
                  { id: 'booking', label: 'Flight & Hotel' },
                  { id: 'payments', label: 'Payment Ledger' },
                  { id: 'timeline', label: 'Audit Timeline' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCaseTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                      caseTab === tab.id
                        ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]'
                        : 'text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {caseTab === 'overview' && (
                <div className="space-y-4 text-xs font-body">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
                      <span className="mono-eyebrow text-[9.5px]">Assigned Sales Consultant</span>
                      <div className="font-semibold text-sm text-[var(--text)]">{selectedCase.assignedConsultant}</div>
                      <div className="text-[10px] text-[var(--text-3)]">Enquiry capture & quotations</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
                      <span className="mono-eyebrow text-[9.5px]">Assigned Visa Officer</span>
                      <div className="font-semibold text-sm text-[var(--cyan)]">{selectedCase.visaOfficer}</div>
                      <div className="text-[10px] text-[var(--text-3)]">Embassy document audit</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-1">
                      <span className="mono-eyebrow text-[9.5px]">Assigned Operations Staff</span>
                      <div className="font-semibold text-sm text-[var(--mint)]">{selectedCase.operationsStaff}</div>
                      <div className="text-[10px] text-[var(--text-3)]">PNR & hotel confirmations</div>
                    </div>
                  </div>

                  {/* Next Action Box */}
                  <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="mono-eyebrow text-[9.5px] text-[var(--amber)]">Immediate Action Required</span>
                      <div className="font-semibold text-sm text-[var(--text)]">{selectedCase.nextTask.title}</div>
                      <div className="text-[11px] text-[var(--text-3)] font-mono">Due: {selectedCase.nextTask.due}</div>
                    </div>
                    <span className="badge-amber text-[10px] font-mono px-2 py-0.5 rounded">
                      {selectedCase.nextTask.priority}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Travellers */}
              {caseTab === 'travellers' && (
                <div className="space-y-3">
                  <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-body divide-y divide-[var(--line)]">
                    <div className="grid grid-cols-12 p-3 font-semibold text-[var(--text-3)] bg-[var(--surface-2)]">
                      <div className="col-span-4">Passenger Name</div>
                      <div className="col-span-2">Age / Type</div>
                      <div className="col-span-3">Passport Number</div>
                      <div className="col-span-3 text-right">Passport Expiry</div>
                    </div>
                    {selectedCase.travellers.map((t, idx) => (
                      <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                        <div className="col-span-4 font-semibold text-[var(--text)]">{t.name}</div>
                        <div className="col-span-2 text-[var(--text-2)]">{t.type} ({t.age} yrs)</div>
                        <div className="col-span-3 font-mono text-[var(--cyan)]">{t.passport}</div>
                        <div className={`col-span-3 text-right font-mono ${
                          t.expiry.includes('Expiring') ? 'text-[var(--red)] font-bold' : 'text-[var(--text-2)]'
                        }`}>
                          {t.expiry}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Visa */}
              {caseTab === 'visa' && (
                <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
                    <div>
                      <div className="font-semibold text-sm text-[var(--text)]">{selectedCase.visa.type}</div>
                      <div className="text-[10px] text-[var(--text-3)] font-mono">Ref: {selectedCase.visa.referenceNumber}</div>
                    </div>
                    <span className="badge-cyan text-xs font-mono px-2.5 py-1 rounded">
                      {selectedCase.visa.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div>
                      <span className="text-[10px] text-[var(--text-3)]">Destination</span>
                      <div className="text-[var(--text)]">{selectedCase.visa.destination}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-3)]">Submitted On</span>
                      <div className="text-[var(--text)]">{selectedCase.visa.submissionDate}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-3)]">Target Approval</span>
                      <div className="text-[var(--mint)]">{selectedCase.visa.targetApproval}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-3)]">Checklists</span>
                      <div className="text-[var(--text)]">{selectedCase.visa.checklistsCompleted}/{selectedCase.visa.checklistsTotal} Verified</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Docs */}
              {caseTab === 'docs' && (
                <div className="space-y-2 text-xs">
                  {selectedCase.documents.map((d, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--cyan)]" />
                        <div>
                          <div className="font-medium text-[var(--text)]">{d.name}</div>
                          <div className="text-[10px] text-[var(--text-3)]">{d.type}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        d.status === 'VERIFIED' ? 'bg-[var(--mint-dim)] text-[var(--mint)]' : 'bg-[var(--amber-dim)] text-[var(--amber)]'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 5: Booking */}
              {caseTab === 'booking' && (
                <div className="space-y-3 text-xs font-body">
                  {selectedCase.booking ? (
                    <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-[var(--cyan)]" />
                          <span className="font-semibold text-sm text-[var(--text)]">{selectedCase.booking.airline}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-[var(--mint)]">PNR: {selectedCase.booking.pnr}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--text-2)]">
                        <div>
                          <span className="text-[10px] text-[var(--text-3)]">Travel Dates</span>
                          <div className="font-mono text-[var(--text)]">{selectedCase.booking.travelDates}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-3)]">Accommodations</span>
                          <div className="text-[var(--text)]">{selectedCase.booking.hotel}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[var(--text-3)]">
                      Booking ticket not yet issued. Case is pending visa confirmation.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Payments */}
              {caseTab === 'payments' && (
                <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-3 text-center pb-3 border-b border-[var(--line)]">
                    <div>
                      <span className="text-[10px] text-[var(--text-3)]">Total Invoice</span>
                      <div className="text-base font-bold text-[var(--text)]">PKR {selectedCase.payment.totalPKR.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-3)]">Amount Paid</span>
                      <div className="text-base font-bold text-[var(--mint)]">PKR {selectedCase.payment.paidPKR.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-3)]">Balance Due</span>
                      <div className={`text-base font-bold ${selectedCase.payment.balancePKR > 0 ? 'text-[var(--red)]' : 'text-[var(--mint)]'}`}>
                        PKR {selectedCase.payment.balancePKR.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] text-right">
                    Last Receipt Issued: <strong className="text-[var(--cyan)]">{selectedCase.payment.lastReceipt}</strong>
                  </div>
                </div>
              )}

              {/* Tab 7: Timeline */}
              {caseTab === 'timeline' && (
                <div className="space-y-3 pl-3 border-l border-[var(--line-2)] text-xs font-body">
                  {selectedCase.timeline.map((item, idx) => (
                    <div key={idx} className="relative pb-3 last:pb-0">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--mint)] ring-4 ring-[var(--surface)]" />
                      <div className="font-mono text-[10px] text-[var(--text-3)]">{item.time}</div>
                      <div className="text-xs text-[var(--text)] mt-0.5">{item.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="sd-card p-12 text-center text-xs text-[var(--text-3)]">
              Select a travel case from the queue to inspect 360° details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
