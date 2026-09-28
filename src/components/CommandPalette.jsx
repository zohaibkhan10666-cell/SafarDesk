import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  Plane, 
  FileText, 
  User, 
  CreditCard, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  Building,
  Package,
  CheckSquare,
  Globe
} from 'lucide-react';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  leads, 
  customers, 
  visaCases, 
  bookings, 
  onNavigate 
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search results
  const matchedLeads = q ? leads.filter(l => 
    l.name.toLowerCase().includes(q) || 
    l.phone.includes(q) || 
    l.destination.toLowerCase().includes(q) ||
    l.id.toLowerCase().includes(q)
  ) : [];

  const matchedCustomers = q ? customers.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.phone.includes(q) || 
    c.cnic.includes(q) ||
    c.travellers?.some(t => t.passportNumber.toLowerCase().includes(q))
  ) : [];

  const matchedVisaCases = q ? visaCases.filter(v => 
    v.customerName.toLowerCase().includes(q) || 
    v.destination.toLowerCase().includes(q) || 
    v.referenceNumber.toLowerCase().includes(q) ||
    v.id.toLowerCase().includes(q)
  ) : [];

  const matchedBookings = q ? bookings.filter(b => 
    b.customerName.toLowerCase().includes(q) || 
    b.bookingCode.toLowerCase().includes(q) || 
    b.flightDetails?.pnr?.toLowerCase().includes(q) ||
    b.destination.toLowerCase().includes(q)
  ) : [];

  const quickNav = [
    { label: 'Go to Leads & CRM Pipeline', tab: 'leads', icon: MessageSquare },
    { label: 'Go to Tasks & Follow-ups Action Center', tab: 'tasks', icon: CheckSquare },
    { label: 'Go to Visa Case Verification', tab: 'visa', icon: FileText },
    { label: 'Go to Package Builder & Catalog', tab: 'packages', icon: Package },
    { label: 'Go to Quotations & Pricing Engine', tab: 'quotations', icon: CreditCard },
    { label: 'Go to Bookings & Itineraries', tab: 'bookings', icon: Plane },
    { label: 'Go to Customer Public Tracking Portal', tab: 'portal', icon: Globe },
    { label: 'Go to Finance & Payments Ledger', tab: 'finance', icon: CreditCard }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]">
          <Search className="w-4 h-4 text-[var(--color-mute)] mr-2 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a customer name, phone, CNIC, passport number, PNR, or visa reference..."
            className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder-[var(--color-faint)] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-[var(--color-hairline-soft)] rounded text-[var(--color-mute)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--color-hairline)] bg-[var(--color-canvas-elevated)] text-[var(--color-mute)]">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[var(--color-hairline)]">
          {/* If no query, show Quick Navigation shortcuts */}
          {!q && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase text-[var(--color-mute)]">
                Quick Navigation Shortcuts
              </div>
              {quickNav.map((nav, idx) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate(nav.tab);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-hairline-soft)] rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[var(--color-link)]" />
                      <span>{nav.label}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[var(--color-mute)]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Leads Match */}
          {matchedLeads.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase text-[var(--color-mute)]">
                Leads ({matchedLeads.length})
              </div>
              {matchedLeads.map(l => (
                <button
                  key={l.id}
                  onClick={() => {
                    onNavigate('leads');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[var(--color-hairline-soft)] rounded-md transition-colors"
                >
                  <div>
                    <span className="font-semibold text-[var(--color-ink)]">{l.name}</span>
                    <span className="text-[var(--color-mute)] ml-2 text-[11px]">{l.destination} · {l.phone}</span>
                  </div>
                  <span className="mono-eyebrow px-1.5 py-0.5 rounded bg-[var(--color-canvas)] text-[10px]">
                    {l.stage}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Customers & Travellers Match */}
          {matchedCustomers.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase text-[var(--color-mute)]">
                Customers & Passports ({matchedCustomers.length})
              </div>
              {matchedCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onNavigate('customers');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[var(--color-hairline-soft)] rounded-md transition-colors"
                >
                  <div>
                    <span className="font-semibold text-[var(--color-ink)]">{c.name}</span>
                    <span className="text-[var(--color-mute)] ml-2 text-[11px]">
                      CNIC: {c.cnic} · Passports: {c.travellers?.map(t => t.passportNumber).join(', ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--color-link)] font-medium">View Profile</span>
                </button>
              ))}
            </div>
          )}

          {/* Visa Cases Match */}
          {matchedVisaCases.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase text-[var(--color-mute)]">
                Visa Applications ({matchedVisaCases.length})
              </div>
              {matchedVisaCases.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    onNavigate('visa');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[var(--color-hairline-soft)] rounded-md transition-colors"
                >
                  <div>
                    <span className="font-semibold text-[var(--color-ink)]">{v.customerName}</span>
                    <span className="text-[var(--color-mute)] ml-2 text-[11px]">
                      {v.destination} · Ref: <span className="font-mono">{v.referenceNumber}</span>
                    </span>
                  </div>
                  <span className="mono-eyebrow px-1.5 py-0.5 rounded bg-[var(--color-canvas)] text-[10px]">
                    {v.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Bookings & PNR Match */}
          {matchedBookings.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase text-[var(--color-mute)]">
                Bookings & PNRs ({matchedBookings.length})
              </div>
              {matchedBookings.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    onNavigate('bookings');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[var(--color-hairline-soft)] rounded-md transition-colors"
                >
                  <div>
                    <span className="font-semibold text-[var(--color-ink)]">{b.customerName}</span>
                    <span className="text-[var(--color-mute)] ml-2 text-[11px]">
                      PNR: <span className="font-mono text-blue-600 font-medium">{b.flightDetails?.pnr}</span> · {b.destination}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--color-body)]">
                    PKR {b.totalAmountPKR.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {q && matchedLeads.length === 0 && matchedCustomers.length === 0 && matchedVisaCases.length === 0 && matchedBookings.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--color-mute)]">
              No matching records found for "{query}". Try searching by customer name, PNR, or passport number.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-canvas)] border-t border-[var(--color-hairline)] text-[11px] text-[var(--color-mute)]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="font-mono text-[10px]">Tenant ID: ORG-SAFARDESK-PK</span>
        </div>
      </div>
    </div>
  );
}
