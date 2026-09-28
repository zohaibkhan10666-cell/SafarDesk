import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  Eye, 
  CheckCircle2, 
  Send, 
  Clock, 
  DollarSign, 
  X,
  FileText
} from 'lucide-react';
import { initialAgencyData } from '../data/mockData';

export default function QuotationsView({ quotations, setQuotations }) {
  const [selectedQuote, setSelectedQuote] = useState(quotations[0] || null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(null);

  // New item draft state
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Flight');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(50000);
  const [newItemPrice, setNewItemPrice] = useState(65000);

  const openQuoteEditor = (quote = null) => {
    setQuoteDraft(quote ? { ...quote } : {
      id: `QUO-${Date.now()}`,
      customerName: '', customerId: '', destination: '', travelDates: '', travellerCount: 1,
      quotationNumber: `SFD-QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      validUntil: '', status: 'DRAFT', currency: 'PKR', items: [], terms: '', notes: ''
    });
    setShowQuoteModal(true);
  };

  const saveQuote = (event) => {
    event.preventDefault();
    if (!quoteDraft.customerName || !quoteDraft.destination) return;
    const exists = quotations.some(q => q.id === quoteDraft.id);
    const next = exists ? quotations.map(q => q.id === quoteDraft.id ? quoteDraft : q) : [quoteDraft, ...quotations];
    setQuotations(next);
    setSelectedQuote(quoteDraft);
    setShowQuoteModal(false);
  };

  // Add line item to active quote
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemDesc || !selectedQuote) return;

    const newItem = {
      id: `item-${Date.now()}`,
      description: newItemDesc,
      category: newItemCategory,
      qty: parseInt(newItemQty) || 1,
      unitCost: parseFloat(newItemCost) || 0,
      customerPrice: parseFloat(newItemPrice) || 0
    };

    const updated = quotations.map(q => {
      if (q.id === selectedQuote.id) {
        return { ...q, items: [...q.items, newItem] };
      }
      return q;
    });

    setQuotations(updated);
    setSelectedQuote({ ...selectedQuote, items: [...selectedQuote.items, newItem] });
    setNewItemDesc('');
  };

  const removeItem = (quoteId, itemId) => {
    const updated = quotations.map(q => {
      if (q.id === quoteId) {
        return { ...q, items: q.items.filter(i => i.id !== itemId) };
      }
      return q;
    });
    setQuotations(updated);
    if (selectedQuote && selectedQuote.id === quoteId) {
      setSelectedQuote({ ...selectedQuote, items: selectedQuote.items.filter(i => i.id !== itemId) });
    }
  };

  // Calculate live totals for the active quotation
  const totalCustomerPrice = selectedQuote ? selectedQuote.items.reduce((acc, i) => acc + (i.customerPrice * i.qty), 0) : 0;
  const totalSupplierCost = selectedQuote ? selectedQuote.items.reduce((acc, i) => acc + (i.unitCost * i.qty), 0) : 0;
  const grossMargin = totalCustomerPrice - totalSupplierCost;
  const marginPercentage = totalCustomerPrice > 0 ? ((grossMargin / totalCustomerPrice) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Quotations & Pricing Architect
          </h1>
          <p className="text-xs text-[var(--color-body)]">
            Interactive multi-item quotation builder with real-time margin yield calculation and branded PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => openQuoteEditor()} className="btn-secondary-pill shadow-xs">
            <Plus className="w-4 h-4" />
            <span>New Customer Quotation</span>
          </button>
          {selectedQuote && (
            <button
              onClick={() => openQuoteEditor(selectedQuote)}
              className="btn-primary-pill shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Edit Customer Quotation</span>
            </button>
          )}
          {selectedQuote && <button onClick={() => setShowPrintModal(true)} className="p-2 rounded-md border border-[var(--color-hairline)] text-[var(--color-ink)]" title="Preview and print quotation"><Printer className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* Main Split: Quotes List on Left, Active Quote Builder on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Quotes List (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
          {quotations.map((q) => {
            const isSelected = selectedQuote?.id === q.id;
            const quoteTotal = q.items.reduce((acc, i) => acc + (i.customerPrice * i.qty), 0);

            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuote(q)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'border-[var(--color-ink)] bg-[var(--color-canvas-elevated)] shadow-xs'
                    : 'border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] hover:border-[var(--color-mute)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="mono-eyebrow text-[9px]">{q.quotationNumber}</span>
                    <h4 className="font-semibold text-xs text-[var(--color-ink)] mt-0.5">{q.customerName}</h4>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                    q.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {q.status}
                  </span>
                </div>

                <div className="text-[11px] text-[var(--color-body)]">{q.destination}</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--color-hairline)]">
                  <span className="text-[var(--color-mute)] font-mono">{q.travelDates}</span>
                  <span className="font-semibold font-mono text-[var(--color-ink)]">
                    PKR {quoteTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Active Quote Builder (8 cols) */}
        {selectedQuote ? (
          <div className="lg:col-span-8 hairline-card p-6 space-y-6">
            {/* Quote Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-hairline)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono-eyebrow text-[10px]">{selectedQuote.quotationNumber}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-blue-700">
                    Valid until {selectedQuote.validUntil}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[var(--color-ink)] mt-0.5">
                  {selectedQuote.destination}
                </h2>
                <div className="text-xs text-[var(--color-mute)]">
                  Prepared for: <strong className="text-[var(--color-ink)]">{selectedQuote.customerName}</strong> ({selectedQuote.travellerCount} Pax)
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Status: {selectedQuote.status}
                </span>
              </div>
            </div>

            {/* Live Financial Margins Summary Bar */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-xs">
              <div>
                <div className="text-[10px] text-[var(--color-mute)] uppercase font-mono">Total Customer Price</div>
                <div className="text-lg font-semibold font-mono text-[var(--color-ink)] mt-0.5">
                  PKR {totalCustomerPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--color-mute)] uppercase font-mono">Supplier Direct Cost</div>
                <div className="text-lg font-mono text-[var(--color-body)] mt-0.5">
                  PKR {totalSupplierCost.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--color-mute)] uppercase font-mono">Gross Margin Yield</div>
                <div className="text-lg font-semibold font-mono text-emerald-600 mt-0.5">
                  PKR {grossMargin.toLocaleString()} <span className="text-xs font-normal">({marginPercentage}%)</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                Quotation Line Items & Inclusions
              </h3>

              <div className="border border-[var(--color-hairline)] rounded-xl overflow-hidden bg-[var(--color-canvas)] shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-mute)]">
                      <th className="py-2.5 px-3 font-medium">Service Description</th>
                      <th className="py-2.5 px-3 font-medium">Category</th>
                      <th className="py-2.5 px-3 font-medium text-center">Qty</th>
                      <th className="py-2.5 px-3 font-medium text-right">Cost (PKR)</th>
                      <th className="py-2.5 px-3 font-medium text-right">Customer Price</th>
                      <th className="py-2.5 px-3 font-medium text-right">Margin</th>
                      <th className="py-2.5 px-3 font-medium text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-hairline)]">
                    {selectedQuote.items.map((item) => {
                      const itemTotalCost = item.unitCost * item.qty;
                      const itemTotalPrice = item.customerPrice * item.qty;
                      const itemMargin = itemTotalPrice - itemTotalCost;

                      return (
                        <tr key={item.id} className="hover:bg-[var(--color-hairline-soft)] transition-colors">
                          <td className="py-2.5 px-3 font-medium text-[var(--color-ink)]">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-hairline-soft)] font-medium">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{item.qty}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[var(--color-mute)]">
                            ₨{item.unitCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-[var(--color-ink)]">
                            ₨{item.customerPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">
                            +₨{itemMargin.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => removeItem(selectedQuote.id, item.id)}
                              className="p-1 text-[var(--color-mute)] hover:text-red-600 rounded"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Line Item Form */}
            <form onSubmit={handleAddItem} className="p-3.5 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] space-y-3">
              <span className="text-[11px] font-semibold text-[var(--color-ink)]">Add Line Item to Quotation</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="e.g. 4-Star Hotel Deluxe Room 5 Nights"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="sm:col-span-5 p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-ink)] focus:outline-none"
                  required
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="sm:col-span-2 p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-ink)] focus:outline-none"
                >
                  <option value="Flight">Flight</option>
                  <option value="Visa">Visa</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Transport">Transport</option>
                  <option value="Tours">Tours</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Service Fee">Service Fee</option>
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="sm:col-span-1 p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-ink)] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Cost (PKR)"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  className="sm:col-span-2 p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-ink)] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Sell (PKR)"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="sm:col-span-2 p-2 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-ink)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-app-sm">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Item</span>
                </button>
              </div>
            </form>

            {/* Terms and conditions */}
            <div className="p-3 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-xs space-y-1">
              <span className="font-semibold text-[var(--color-ink)]">Commercial Terms:</span>
              <p className="text-[var(--color-mute)] leading-relaxed">{selectedQuote.terms}</p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 hairline-card p-12 text-center text-xs text-[var(--color-mute)]">
            Select a quotation to edit services, markup, or generate client PDF.
          </div>
        )}
      </div>

      {showQuoteModal && quoteDraft && (
        <div onClick={() => setShowQuoteModal(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={saveQuote} onClick={e => e.stopPropagation()} className="w-full max-w-2xl sd-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div><h2 className="text-base font-semibold text-[var(--text)]">{quotations.some(q => q.id === quoteDraft.id) ? 'Edit Customer Quotation' : 'Create Customer Quotation'}</h2><p className="text-xs text-[var(--text-3)]">Assign pricing to a specific customer and traveller group.</p></div>
              <button type="button" onClick={() => setShowQuoteModal(false)} className="p-1.5 text-[var(--text-2)]"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[['customerName','Customer name'],['customerId','Customer ID'],['destination','Destination / package'],['travelDates','Travel dates'],['quotationNumber','Quotation number'],['validUntil','Valid until']].map(([key, label]) => <label key={key} className="space-y-1"><span className="text-[var(--text-2)]">{label}</span><input required={['customerName','destination'].includes(key)} value={quoteDraft[key]} onChange={e => setQuoteDraft({ ...quoteDraft, [key]: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" /></label>)}
              <label className="space-y-1"><span className="text-[var(--text-2)]">Travellers</span><input type="number" min="1" value={quoteDraft.travellerCount} onChange={e => setQuoteDraft({ ...quoteDraft, travellerCount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" /></label>
              <label className="space-y-1"><span className="text-[var(--text-2)]">Status</span><select value={quoteDraft.status} onChange={e => setQuoteDraft({ ...quoteDraft, status: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]"><option>DRAFT</option><option>SENT</option><option>ACCEPTED</option><option>DECLINED</option></select></label>
              <label className="sm:col-span-2 space-y-1"><span className="text-[var(--text-2)]">Commercial terms</span><textarea rows="2" value={quoteDraft.terms} onChange={e => setQuoteDraft({ ...quoteDraft, terms: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)]" /></label>
            </div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowQuoteModal(false)} className="btn-secondary-pill">Cancel</button><button type="submit" className="btn-primary-pill"><CheckCircle2 className="w-4 h-4" /> Save quotation</button></div>
          </form>
        </div>
      )}

      {/* BRANDED PRINTABLE QUOTATION PDF MODAL */}
      {showPrintModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white text-black rounded-xl shadow-2xl p-8 space-y-6 my-auto">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Official Client Quotation Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-md bg-black text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 print:p-0">
              {/* Agency Letterhead */}
              <div className="flex justify-between items-start pb-6 border-b border-gray-300">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-black">{initialAgencyData.name}</h1>
                  <p className="text-xs text-gray-600 mt-1">{initialAgencyData.tagline}</p>
                  <div className="text-[11px] text-gray-500 mt-1 font-mono">
                    Lic: {initialAgencyData.licenseNumber} · {initialAgencyData.headquarters}
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    Tel: {initialAgencyData.phone} · WhatsApp: {initialAgencyData.whatsapp}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono uppercase text-gray-500">Quotation No.</div>
                  <div className="text-base font-bold font-mono text-black">{selectedQuote.quotationNumber}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</div>
                  <div className="text-[11px] text-red-600 font-medium">Valid Until: {selectedQuote.validUntil}</div>
                </div>
              </div>

              {/* Client & Itinerary Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500">Quotation For:</span>
                  <div className="font-bold text-sm text-black mt-0.5">{selectedQuote.customerName}</div>
                  <div className="text-gray-600">Total Travellers: <strong>{selectedQuote.travellerCount} Persons</strong></div>
                </div>
                <div>
                  <span className="text-gray-500">Package / Destination:</span>
                  <div className="font-bold text-sm text-black mt-0.5">{selectedQuote.destination}</div>
                  <div className="text-gray-600">Travel Window: <strong>{selectedQuote.travelDates}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-black text-gray-700">
                      <th className="py-2 font-semibold">Service Inclusions</th>
                      <th className="py-2 font-semibold">Category</th>
                      <th className="py-2 font-semibold text-center">Qty</th>
                      <th className="py-2 font-semibold text-right">Unit Price (PKR)</th>
                      <th className="py-2 font-semibold text-right">Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedQuote.items.map((item, idx) => (
                      <tr key={idx} className="py-2">
                        <td className="py-2 font-medium text-black">{item.description}</td>
                        <td className="py-2 text-gray-600">{item.category}</td>
                        <td className="py-2 text-center font-mono">{item.qty}</td>
                        <td className="py-2 text-right font-mono">₨{item.customerPrice.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono font-bold text-black">₨{(item.customerPrice * item.qty).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand Total Callout */}
              <div className="flex justify-end pt-4 border-t-2 border-black">
                <div className="text-right space-y-1">
                  <span className="text-xs text-gray-600">Total Package Amount:</span>
                  <div className="text-2xl font-bold font-mono text-black">
                    PKR {totalCustomerPrice.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500">Includes all government taxes, airline fuel surcharges & service fees</div>
                </div>
              </div>

              {/* Terms */}
              <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-600 space-y-1">
                <strong className="text-black">Terms & Payment Schedule:</strong>
                <p>{selectedQuote.terms}</p>
                <p className="font-mono text-[10px] text-gray-400 mt-2">
                  Generated by SafarDesk ERP · Confidential Customer Document
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
