import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  DollarSign, 
  Building, 
  Phone, 
  ArrowUpRight, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  X,
  Printer,
  ChevronRight,
  TrendingDown,
  Layers,
  Award
} from 'lucide-react';
import { 
  initialSuppliers, 
  initialSupplierLedger, 
  initialCommissions 
} from '../data/mockData';

export default function SuppliersView() {
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers', 'ledger', 'commissions'
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [ledger, setLedger] = useState(initialSupplierLedger);
  const [commissions, setCommissions] = useState(initialCommissions);

  const [selectedSupplierId, setSelectedSupplierId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // New Supplier Payment form
  const [paySupplierId, setPaySupplierId] = useState('sup-1');
  const [payAmount, setPayAmount] = useState('200000');
  const [payBank, setPayBank] = useState('Meezan Bank Corporate Raast');
  const [payRef, setPayRef] = useState('TXN-WIRE-889102');
  const [payNotes, setPayNotes] = useState('Weekly ticket issuance reconciliation');

  const totalPayables = suppliers.reduce((acc, s) => acc + s.payableBalancePKR, 0);
  const totalCreditLimits = suppliers.reduce((acc, s) => acc + (s.creditLimitPKR || 0), 0);
  const totalCommissionsPending = commissions.filter(c => c.status !== 'PAID').reduce((acc, c) => acc + c.commissionAmountPKR, 0);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!payAmount || !paySupplierId) return;

    const amountNum = parseFloat(payAmount) || 0;
    const sup = suppliers.find(s => s.id === paySupplierId);

    // Update supplier running balance
    const updatedSuppliers = suppliers.map(s => {
      if (s.id === paySupplierId) {
        return { ...s, payableBalancePKR: Math.max(0, s.payableBalancePKR - amountNum) };
      }
      return s;
    });

    // Add entry to ledger
    const newEntry = {
      id: `LED-${Date.now()}`,
      supplierId: paySupplierId,
      date: new Date().toISOString().split('T')[0],
      ref: payRef,
      description: `Payment recorded via ${payBank} (${payNotes})`,
      debit: 0,
      credit: amountNum,
      balance: Math.max(0, (sup?.payableBalancePKR || 0) - amountNum),
      currency: sup?.currency || 'PKR'
    };

    setSuppliers(updatedSuppliers);
    setLedger([newEntry, ...ledger]);
    setIsPaymentModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLedger = ledger.filter(l => {
    const matchesSupplier = selectedSupplierId === 'ALL' || l.supplierId === selectedSupplierId;
    const matchesSearch = l.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSupplier && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              Suppliers, GDS Ledgers & Commissions
            </h1>
            <span className="badge-mint text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              README §17 & §18
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Consolidator payables, GDS ticketing credit lines, Umrah DMC accounts, and sub-agent commission disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="btn-primary-pill shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Supplier Settlement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sd-card p-4 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--red)]">Total Agency Payables</span>
          <div className="text-2xl font-bold font-mono text-[var(--red)]">
            PKR {totalPayables.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">Across 5 consolidator & DMC accounts</div>
        </div>

        <div className="sd-card p-4 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--cyan)]">Total GDS Credit Line</span>
          <div className="text-2xl font-bold font-mono text-[var(--cyan)]">
            PKR {totalCreditLimits.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--mint)] font-medium">
            ₨{( (totalPayables / totalCreditLimits) * 100 ).toFixed(1)}% Credit Utilized
          </div>
        </div>

        <div className="sd-card p-4 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--amber)]">Pending Commission Payouts</span>
          <div className="text-2xl font-bold font-mono text-[var(--amber)]">
            PKR {totalCommissionsPending.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-3)]">Sub-agents & sales incentives due</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeTab === 'suppliers'
                ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Supplier Accounts ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeTab === 'ledger'
                ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Reconciliation Ledger ({ledger.length})
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeTab === 'commissions'
                ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Commissions & Sub-Agents ({commissions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers, accounts, refs..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--line-2)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--mint)]"
          />
        </div>
      </div>

      {/* Tab 1: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((sup) => {
            const utilizationPct = Math.min(100, Math.round((sup.payableBalancePKR / (sup.creditLimitPKR || 1)) * 100));

            return (
              <div key={sup.id} className="sd-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="mono-eyebrow text-[9px] text-[var(--cyan)]">{sup.type}</span>
                    <h3 className="font-semibold text-sm text-[var(--text)] font-display mt-0.5">{sup.name}</h3>
                    <div className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">Acc: {sup.accountNumber}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.3)]">
                    {sup.currency} Account
                  </span>
                </div>

                {/* Credit Limit & Balance Progress Bar */}
                <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-3)]">Outstanding Payable:</span>
                    <span className="font-mono font-bold text-sm text-[var(--red)]">
                      PKR {sup.payableBalancePKR.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-3)]">
                      <span>Limit: PKR {sup.creditLimitPKR?.toLocaleString()}</span>
                      <span className={utilizationPct > 80 ? 'text-[var(--red)] font-bold' : 'text-[var(--mint)]'}>
                        {utilizationPct}% Used
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <div 
                        className={`h-full transition-all ${utilizationPct > 80 ? 'bg-[var(--red)]' : 'bg-[var(--cyan)]'}`}
                        style={{ width: `${utilizationPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[var(--text-2)] space-y-1 font-body">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{sup.contact}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] font-mono">{sup.email}</div>
                </div>

                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <button 
                    onClick={() => {
                      setPaySupplierId(sup.id);
                      setIsPaymentModalOpen(true);
                    }}
                    className="text-xs font-semibold text-[var(--mint)] hover:underline flex items-center gap-1"
                  >
                    <span>Record Settlement</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedSupplierId(sup.id);
                      setActiveTab('ledger');
                    }}
                    className="btn-ghost-sm text-xs"
                  >
                    <span>View Ledger</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Reconciliation Transaction Ledger */}
      {activeTab === 'ledger' && (
        <div className="sd-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-3">
              <span className="mono-eyebrow text-[10px]">Filter by Supplier:</span>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)] font-body"
              >
                <option value="ALL">All Consolidated Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.currency})</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => window.print()}
              className="btn-ghost-sm text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ledger Statement</span>
            </button>
          </div>

          <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-body divide-y divide-[var(--line)]">
            <div className="grid grid-cols-12 p-3 font-semibold text-[var(--text-3)] bg-[var(--surface-2)]">
              <div className="col-span-2">Date / Ref</div>
              <div className="col-span-5">Description & Supplier</div>
              <div className="col-span-2 text-right">Debit (Service)</div>
              <div className="col-span-2 text-right">Credit (Payment)</div>
              <div className="col-span-1 text-right">Balance</div>
            </div>

            {filteredLedger.map((row) => (
              <div key={row.id} className="grid grid-cols-12 p-3 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                <div className="col-span-2">
                  <div className="font-mono text-[11px] text-[var(--text)]">{row.date}</div>
                  <div className="text-[10px] text-[var(--text-3)] font-mono">{row.ref}</div>
                </div>
                <div className="col-span-5">
                  <div className="font-medium text-[var(--text)]">{row.description}</div>
                  <div className="text-[10px] text-[var(--cyan)]">
                    {suppliers.find(s => s.id === row.supplierId)?.name || 'Consolidator'}
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono font-semibold text-[var(--red)]">
                  {row.debit > 0 ? `PKR ${row.debit.toLocaleString()}` : '—'}
                </div>
                <div className="col-span-2 text-right font-mono font-semibold text-[var(--mint)]">
                  {row.credit > 0 ? `PKR ${row.credit.toLocaleString()}` : '—'}
                </div>
                <div className="col-span-1 text-right font-mono text-[var(--text-2)]">
                  {row.balance > 0 ? `₨${(row.balance/1000).toFixed(0)}k` : '₨0'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Commission Management */}
      {activeTab === 'commissions' && (
        <div className="sd-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-display">
                Sales Consultant & Sub-Agency Commissions
              </h3>
              <p className="text-xs text-[var(--text-3)] font-body">
                Calculated incentive payouts based on confirmed booking revenues
              </p>
            </div>
            <Award className="w-6 h-6 text-[var(--amber)]" />
          </div>

          <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-body divide-y divide-[var(--line)]">
            <div className="grid grid-cols-12 p-3 font-semibold text-[var(--text-3)] bg-[var(--surface-2)]">
              <div className="col-span-3">Agent / Sub-Agency</div>
              <div className="col-span-3">Booking Ref & Client</div>
              <div className="col-span-2">Sales Volume</div>
              <div className="col-span-2">Commission Earned</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {commissions.map((comm) => (
              <div key={comm.id} className="grid grid-cols-12 p-3 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
                <div className="col-span-3">
                  <div className="font-semibold text-[var(--text)]">{comm.agentName}</div>
                  <div className="text-[10px] text-[var(--text-3)]">{comm.type} · {comm.branch}</div>
                </div>
                <div className="col-span-3">
                  <div className="font-mono text-[11px] text-[var(--cyan)]">{comm.bookingRef}</div>
                  <div className="text-[11px] text-[var(--text-2)]">{comm.customerName} ({comm.destination})</div>
                </div>
                <div className="col-span-2 font-mono text-[var(--text)]">
                  PKR {comm.salesAmountPKR.toLocaleString()}
                </div>
                <div className="col-span-2">
                  <div className="font-mono font-bold text-[var(--mint)]">
                    PKR {comm.commissionAmountPKR.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] font-mono">Rate: {comm.commissionRate}</div>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    comm.status === 'PAID' ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]' :
                    comm.status === 'APPROVED_PAYABLE' ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[rgba(45,168,240,0.3)]' :
                    'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(229,176,74,0.3)]'
                  }`}>
                    {comm.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Supplier Settlement Modal */}
      {isPaymentModalOpen && (
        <div 
          onClick={() => setIsPaymentModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="sd-card max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] font-display">Record Supplier Settlement</h2>
                <p className="text-xs text-[var(--text-3)] font-body">Debit consolidator or DMC payable balance</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs font-body">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Consolidator / Supplier</label>
                <select
                  value={paySupplierId}
                  onChange={(e) => setPaySupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: PKR {s.payableBalancePKR.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Settlement Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Agency Bank Account</label>
                  <select
                    value={payBank}
                    onChange={(e) => setPayBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                  >
                    <option value="Meezan Bank Corporate Raast">Meezan Bank Raast</option>
                    <option value="Habib Bank Limited (HBL) Operations">HBL Operations</option>
                    <option value="Standard Chartered Forex USD/AED">Standard Chartered Forex</option>
                    <option value="Bank Alfalah Pay Order">Bank Alfalah Pay Order</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Bank Reference / Raast TXN ID</label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. TXN-WIRE-889102"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Reconciliation Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Weekly ticket issuance reconciliation"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-pill px-5 py-2 text-xs"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
