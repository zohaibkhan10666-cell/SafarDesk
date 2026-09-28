import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ArrowDownRight, 
  X,
  FileCheck
} from 'lucide-react';
import { initialAgencyData } from '../data/mockData';

export default function FinanceView({ payments, setPayments, bookings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // New Payment state
  const [newPayCustomer, setNewPayCustomer] = useState('Chaudhry Kamran Akram');
  const [newPayAmount, setNewPayAmount] = useState('185000');
  const [newPayMethod, setNewPayMethod] = useState('Bank Transfer (Meezan Raast)');
  const [newPayRef, setNewPayRef] = useState('RAAST-TXN-109238');
  const [newPayNotes, setNewPayNotes] = useState('Final settlement for Dubai tour.');

  const totalCollectedPKR = payments.reduce((acc, p) => acc + p.amountPKR, 0);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!newPayCustomer || !newPayAmount) return;

    const newPayment = {
      id: `PAY-${Date.now()}`,
      receiptNumber: `SFD-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: 'BKG-501',
      customerName: newPayCustomer,
      amountPKR: parseFloat(newPayAmount) || 0,
      paymentMethod: newPayMethod,
      reference: newPayRef,
      paymentDate: new Date().toISOString().split('T')[0],
      type: 'Final Settlement',
      status: 'VERIFIED',
      verifiedBy: 'Usman Ali',
      notes: newPayNotes
    };

    setPayments([newPayment, ...payments]);
    setIsRecordModalOpen(false);
  };

  const filteredPayments = payments.filter(p => 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Finance, Payments & Installments
          </h1>
          <p className="text-xs text-[var(--color-body)]">
            Verified bank payment logs, automated receipt generation, and client installment schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="btn-app-sm shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="hairline-card p-4">
          <div className="text-[10px] mono-eyebrow text-[var(--color-mute)]">Total Revenue Collected</div>
          <div className="text-2xl font-semibold font-mono text-emerald-600 mt-1">
            PKR {totalCollectedPKR.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--color-mute)] mt-0.5">Meezan & HBL corporate accounts</div>
        </div>

        <div className="hairline-card p-4">
          <div className="text-[10px] mono-eyebrow text-red-500">Overdue Installments</div>
          <div className="text-2xl font-semibold font-mono text-red-600 mt-1">
            PKR 185,000
          </div>
          <div className="text-[11px] text-red-600 mt-0.5 font-medium">1 client account past due date</div>
        </div>

        <div className="hairline-card p-4">
          <div className="text-[10px] mono-eyebrow text-[var(--color-mute)]">Supplier Direct Payables</div>
          <div className="text-2xl font-semibold font-mono text-[var(--color-ink)] mt-1">
            PKR 1,120,000
          </div>
          <div className="text-[11px] text-[var(--color-mute)] mt-0.5">Air Arabia, Rayna Tours, Bab-ul-Umrah</div>
        </div>
      </div>

      {/* Payments History Table */}
      <div className="border border-[var(--color-hairline)] rounded-xl bg-[var(--color-canvas-elevated)] overflow-hidden shadow-2xs">
        <div className="p-3 border-b border-[var(--color-hairline)] flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[var(--color-mute)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt number, reference, or client..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-md text-[var(--color-ink)] focus:outline-none"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-mute)]">
              <th className="py-2.5 px-3 font-medium">Receipt No.</th>
              <th className="py-2.5 px-3 font-medium">Client Name</th>
              <th className="py-2.5 px-3 font-medium">Amount (PKR)</th>
              <th className="py-2.5 px-3 font-medium">Payment Method</th>
              <th className="py-2.5 px-3 font-medium">Bank Reference</th>
              <th className="py-2.5 px-3 font-medium">Payment Date</th>
              <th className="py-2.5 px-3 font-medium">Audit Verification</th>
              <th className="py-2.5 px-3 font-medium text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-hairline)]">
            {filteredPayments.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--color-hairline-soft)] transition-colors">
                <td className="py-2.5 px-3 font-mono font-medium text-[var(--color-ink)]">
                  {p.receiptNumber}
                </td>
                <td className="py-2.5 px-3 font-medium text-[var(--color-ink)]">{p.customerName}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                  ₨{p.amountPKR.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-[var(--color-body)]">{p.paymentMethod}</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--color-mute)]">{p.reference}</td>
                <td className="py-2.5 px-3 font-mono text-[var(--color-mute)]">{p.paymentDate}</td>
                <td className="py-2.5 px-3">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified by {p.verifiedBy}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => setSelectedReceipt(p)}
                    className="btn-ghost-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-hairline)]">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Record Verified Client Payment</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="p-1 text-[var(--color-mute)] hover:bg-[var(--color-hairline-soft)] rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-[var(--color-body)]">Customer</label>
                <input
                  type="text"
                  value={newPayCustomer}
                  onChange={(e) => setNewPayCustomer(e.target.value)}
                  className="w-full p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--color-body)]">Amount (PKR) *</label>
                  <input
                    type="number"
                    value={newPayAmount}
                    onChange={(e) => setNewPayAmount(e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--color-body)]">Payment Channel</label>
                  <select
                    value={newPayMethod}
                    onChange={(e) => setNewPayMethod(e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)]"
                  >
                    <option value="Bank Transfer (Meezan Raast)">Meezan Raast</option>
                    <option value="HBL Online Banking">HBL Online</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="Pay Order">Bank Pay Order</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--color-body)]">Bank Transaction / Reference ID *</label>
                <input
                  type="text"
                  value={newPayRef}
                  onChange={(e) => setNewPayRef(e.target.value)}
                  placeholder="e.g. RAAST-TXN-998124"
                  className="w-full p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--color-body)]">Accountant Notes</label>
                <textarea
                  rows="2"
                  value={newPayNotes}
                  onChange={(e) => setNewPayNotes(e.target.value)}
                  className="w-full p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-hairline)]">
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="btn-ghost-sm">
                  Cancel
                </button>
                <button type="submit" className="btn-app-sm">
                  Record & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE PAYMENT RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white text-black rounded-xl shadow-2xl p-6 space-y-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-xs font-mono uppercase text-gray-500">Official Payment Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded bg-black text-white text-xs font-medium flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="p-1 text-gray-400 hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="space-y-4 text-xs">
              <div className="text-center pb-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-black">{initialAgencyData.name}</h2>
                <p className="text-[11px] text-gray-500">{initialAgencyData.headquarters}</p>
                <p className="text-[11px] text-gray-500 font-mono">NTN / DTS Lic: {initialAgencyData.licenseNumber}</p>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <div className="text-[10px] text-gray-500">Receipt Number</div>
                  <div className="font-mono font-bold text-black">{selectedReceipt.receiptNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Date Received</div>
                  <div className="font-mono font-bold text-black">{selectedReceipt.paymentDate}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Received From:</span>
                  <span className="font-bold text-black">{selectedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Payment Channel:</span>
                  <span className="text-black">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Bank Reference No:</span>
                  <span className="font-mono text-black">{selectedReceipt.reference}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Verified By Officer:</span>
                  <span className="text-emerald-700 font-medium">{selectedReceipt.verifiedBy}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <span className="text-[10px] uppercase font-mono text-emerald-800">Total Settled Amount</span>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  PKR {selectedReceipt.amountPKR.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-600">Electronic verification confirmed · Non-refundable upon ticket issuance</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
