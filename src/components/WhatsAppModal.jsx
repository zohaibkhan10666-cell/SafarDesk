import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  User, 
  Phone, 
  ExternalLink 
} from 'lucide-react';
import { initialWhatsAppTemplates } from '../data/mockData';

export default function WhatsAppModal({ isOpen, onClose, defaultCustomer, defaultPhone, defaultData }) {
  if (!isOpen) return null;

  const [templates] = useState(initialWhatsAppTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id);
  const [customerName, setCustomerName] = useState(defaultCustomer || 'Chaudhry Kamran Akram');
  const [phone, setPhone] = useState(defaultPhone || '+923004455667');
  const [destination, setDestination] = useState(defaultData?.destination || 'Dubai, UAE');
  const [customizedMessage, setCustomizedMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Active template
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Interpolate placeholders
  useEffect(() => {
    let msg = activeTemplate.template;
    msg = msg.replace(/{customerName}/g, customerName || 'Valued Client');
    msg = msg.replace(/{destination}/g, destination || 'your destination');
    msg = msg.replace(/{pax}/g, defaultData?.pax || '4');
    msg = msg.replace(/{consultantName}/g, defaultData?.consultantName || 'Hamza Tariq');
    msg = msg.replace(/{agencyPhone}/g, '+92 300 8472910');
    msg = msg.replace(/{quoteRef}/g, defaultData?.quoteRef || 'QT-2026-089');
    msg = msg.replace(/{services}/g, 'Dubai 5-Day Luxury Family Package');
    msg = msg.replace(/{totalAmount}/g, defaultData?.amount || '1,160,000');
    msg = msg.replace(/{caseRef}/g, defaultData?.caseRef || 'VISA-401');
    msg = msg.replace(/{missingDocsList}/g, '1. Daniyal Kamran Nadra B-Form (English Translation)\n2. Updated Bank Statement (Last 6 Months)\n3. 4x Passport-size Photographs (White Background)');
    msg = msg.replace(/{travellerName}/g, customerName || 'Chaudhry Kamran');
    msg = msg.replace(/{visaRef}/g, 'GDRFA-UAE-992014');
    msg = msg.replace(/{validity}/g, '30 Days Multiple Entry');
    msg = msg.replace(/{branchName}/g, 'Lahore HQ (Gulberg III)');
    msg = msg.replace(/{receiptNo}/g, defaultData?.receiptNo || 'SFD-REC-2026-0412');
    msg = msg.replace(/{amount}/g, defaultData?.amountReceived || '580,000');
    msg = msg.replace(/{paymentMethod}/g, 'Meezan Bank Raast');
    msg = msg.replace(/{reference}/g, 'RAAST-TXN-99812401');
    msg = msg.replace(/{balanceRemaining}/g, '185,000');
    msg = msg.replace(/{travelDate}/g, 'Oct 15, 2026');
    msg = msg.replace(/{airline}/g, 'Emirates Airlines');
    msg = msg.replace(/{pnr}/g, 'EK-8942-LHR');
    msg = msg.replace(/{emergencyPhone}/g, '+92 42 3578 9200');

    setCustomizedMessage(msg);
  }, [selectedTemplateId, customerName, phone, destination, defaultData]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(customizedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsAppWeb = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(customizedMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="sd-card max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] font-display">
                Pakistani Travel WhatsApp Message Hub
              </h2>
              <p className="text-xs text-[var(--text-3)] font-body">
                Official Roman Urdu & English templates with automatic placeholder population (README §20)
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient Input Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs">
          <div className="space-y-1">
            <label className="text-[10px] mono-eyebrow text-[var(--text-3)]">Client Full Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-[var(--surface)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] mono-eyebrow text-[var(--text-3)]">WhatsApp Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-[var(--surface)] border border-[var(--line-2)] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--mint)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] mono-eyebrow text-[var(--text-3)]">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-[var(--surface)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)]"
            />
          </div>
        </div>

        {/* Template Selector Pills */}
        <div className="space-y-1.5">
          <label className="mono-eyebrow text-[10px]">Select Operational Template</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedTemplateId === tpl.id
                    ? 'border-[#25D366] bg-[#25D366]/10 shadow-xs'
                    : 'border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-2)]'
                }`}
              >
                <span className="mono-eyebrow text-[8.5px] text-[var(--cyan)] block">{tpl.category}</span>
                <span className="text-[11px] font-semibold text-[var(--text)] line-clamp-1 mt-0.5">{tpl.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Customized Message Preview Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="mono-eyebrow text-[10px]">Live Message Body (Editable)</label>
            <span className="text-[10px] text-[var(--text-3)] font-mono">Format: WhatsApp Markdown (*bold*, _italic_)</span>
          </div>
          <textarea
            rows={8}
            value={customizedMessage}
            onChange={(e) => setCustomizedMessage(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--navy)] border border-[var(--line-2)] text-xs text-[var(--text)] font-body focus:outline-none focus:border-[#25D366] leading-relaxed"
          />
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-[var(--line-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-[var(--mint)]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[var(--text-3)] hover:text-[var(--text)]"
            >
              Cancel
            </button>
            <button
              onClick={handleOpenWhatsAppWeb}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#25D366] text-black hover:bg-[#20ba59] transition-all shadow-md shadow-[#25D366]/20"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp Web</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
