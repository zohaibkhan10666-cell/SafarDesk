import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  DollarSign, 
  FileText, 
  Award, 
  CheckCircle2, 
  Clock, 
  Download, 
  X,
  Send,
  Building
} from 'lucide-react';
import { initialSubAgentCases } from '../data/mockData';

export default function SubAgentView() {
  const [cases, setCases] = useState(initialSubAgentCases);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Submit form state
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('+92');
  const [destination, setDestination] = useState('Baku, Azerbaijan');
  const [pax, setPax] = useState('2');
  const [notes, setNotes] = useState('');

  const totalSales = cases.reduce((acc, c) => acc + c.salesPKR, 0);
  const totalCommission = cases.reduce((acc, c) => acc + c.commissionPKR, 0);
  const pendingPayout = cases.filter(c => c.payoutStatus !== 'PAID').reduce((acc, c) => acc + c.commissionPKR, 0);

  const handleSubmitCase = (e) => {
    e.preventDefault();
    if (!clientName || !destination) return;

    const estSales = (parseInt(pax) || 1) * 140000;
    const estCommission = Math.round(estSales * 0.04);

    const newCase = {
      id: `SUB-CASE-${Date.now()}`,
      subAgentId: 'sub-portal',
      subAgentName: 'Partner Sub-Agency',
      customerName: clientName,
      destination: destination,
      pax: parseInt(pax) || 1,
      salesPKR: estSales,
      commissionPKR: estCommission,
      status: 'PROCESSING',
      submissionDate: new Date().toISOString().split('T')[0],
      payoutStatus: 'PENDING_APPROVAL'
    };

    setCases([newCase, ...cases]);
    setIsSubmitModalOpen(false);
    setClientName('');
    setNotes('');
  };

  const filteredCases = cases.filter(c => 
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.destination.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              B2B Sub-Agent Partner Portal
            </h1>
            <span className="badge-cyan text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              README §11 (Sub-Agent Scoped)
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Submit customer files, track visa & booking processing, and monitor authorized commission earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="btn-primary-pill shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Client Case</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sd-card p-5 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--cyan)]">Your Partner Sales</span>
          <div className="text-2xl font-bold font-mono text-[var(--text)]">
            PKR {totalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">Across {cases.length} submitted files</div>
        </div>

        <div className="sd-card p-5 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--mint)]">Total Commission Earned</span>
          <div className="text-2xl font-bold font-mono text-[var(--mint)]">
            PKR {totalCommission.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--mint)] font-medium">Standard 4% B2B Partner Rate</div>
        </div>

        <div className="sd-card p-5 space-y-1">
          <span className="mono-eyebrow text-[10px] text-[var(--amber)]">Approved Payout Pending</span>
          <div className="text-2xl font-bold font-mono text-[var(--amber)]">
            PKR {pendingPayout.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">Disbursed bi-weekly via Raast</div>
        </div>
      </div>

      {/* Submitted Cases Directory */}
      <div className="sd-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] font-display">
              Your Submitted Client Cases
            </h3>
            <p className="text-xs text-[var(--text-3)] font-body">
              Real-time processing status by SafarDesk central operations
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client or destination..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-2)] border border-[var(--line-2)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:outline-none focus:border-[var(--mint)]"
            />
          </div>
        </div>

        <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-body divide-y divide-[var(--line)]">
          <div className="grid grid-cols-12 p-3 font-semibold text-[var(--text-3)] bg-[var(--surface-2)]">
            <div className="col-span-3">Case ID & Client Name</div>
            <div className="col-span-2">Destination & Pax</div>
            <div className="col-span-2">Booking Volume</div>
            <div className="col-span-2">Your Commission</div>
            <div className="col-span-2">Processing Status</div>
            <div className="col-span-1 text-right">Documents</div>
          </div>

          {filteredCases.map(c => (
            <div key={c.id} className="grid grid-cols-12 p-3.5 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
              <div className="col-span-3">
                <div className="font-bold text-sm text-[var(--text)] font-display">{c.customerName}</div>
                <div className="font-mono text-[10px] text-[var(--text-3)]">{c.id} · Submitted {c.submissionDate}</div>
              </div>

              <div className="col-span-2 text-[var(--text-2)]">
                <div>{c.destination}</div>
                <div className="text-[10px] text-[var(--text-3)]">{c.pax} Passengers</div>
              </div>

              <div className="col-span-2 font-mono text-xs font-semibold text-[var(--text)]">
                PKR {c.salesPKR.toLocaleString()}
              </div>

              <div className="col-span-2 space-y-0.5">
                <div className="font-mono font-bold text-xs text-[var(--mint)]">
                  PKR {c.commissionPKR.toLocaleString()}
                </div>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono ${
                  c.payoutStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {c.payoutStatus}
                </span>
              </div>

              <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  c.status === 'CONFIRMED' ? 'bg-[var(--mint-dim)] text-[var(--mint)]' : 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                }`}>
                  {c.status}
                </span>
              </div>

              <div className="col-span-1 text-right">
                <button
                  onClick={() => alert(`Client documents for ${c.customerName} downloaded.`)}
                  className="p-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
                  title="Download Issued Documents"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Case Modal */}
      {isSubmitModalOpen && (
        <div 
          onClick={() => setIsSubmitModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="sd-card max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] font-display">Submit New Client Case</h2>
                <p className="text-xs text-[var(--text-3)] font-body">Forward lead to SafarDesk central operations</p>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCase} className="space-y-4 text-xs font-body">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Passenger / Primary Client Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Mian Shahbaz Ahmad"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">WhatsApp Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-2)]">Number of Pax</label>
                  <input
                    type="number"
                    min="1"
                    value={pax}
                    onChange={(e) => setPax(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Travel Destination / Service</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                >
                  <option value="Dubai, UAE (Visa + Hotel)">Dubai, UAE (Visa + Hotel)</option>
                  <option value="Saudi Arabia (Umrah Package)">Saudi Arabia (Umrah Package)</option>
                  <option value="Baku, Azerbaijan (Holiday)">Baku, Azerbaijan (Holiday)</option>
                  <option value="Malaysia & Thailand">Malaysia & Thailand</option>
                  <option value="UK Visitor Visa Audit">UK Visitor Visa Audit</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-2)]">Client Notes & Flight Preferences</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Needs direct flights from Lahore, 4-star hotel near metro."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-pill px-5 py-2 text-xs"
                >
                  Submit to Operations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
