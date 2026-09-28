import React, { useState } from 'react';
import {
  Plus, Search, MessageSquare, Kanban,
  Table as TableIcon, ArrowRight, X, Filter, CheckCircle2, Users
} from 'lucide-react';
import { leadStages } from '../data/mockData';

const stageColors = {
  NEW:           { bg: 'rgba(31,229,163,0.08)',  border: 'rgba(31,229,163,0.22)',  label: 'var(--mint)' },
  CONTACTED:     { bg: 'rgba(45,168,240,0.08)',  border: 'rgba(45,168,240,0.22)',  label: 'var(--cyan)' },
  QUALIFIED:     { bg: 'rgba(40,84,224,0.08)',   border: 'rgba(40,84,224,0.22)',   label: '#6090F0' },
  PROPOSAL_SENT: { bg: 'rgba(229,176,74,0.08)',  border: 'rgba(229,176,74,0.22)',  label: 'var(--amber)' },
  QUOTE_SENT:    { bg: 'rgba(229,176,74,0.08)',  border: 'rgba(229,176,74,0.22)',  label: 'var(--amber)' },
  QUOTE_PREPARING: { bg: 'rgba(229,176,74,0.08)', border: 'rgba(229,176,74,0.22)', label: 'var(--amber)' },
  FOLLOW_UP:     { bg: 'rgba(45,168,240,0.08)',  border: 'rgba(45,168,240,0.22)',  label: 'var(--cyan)' },
  NEGOTIATION:   { bg: 'rgba(240,74,90,0.08)',   border: 'rgba(240,74,90,0.22)',   label: 'var(--red)' },
  CONFIRMED:     { bg: 'rgba(31,229,163,0.14)',  border: 'rgba(31,229,163,0.35)',  label: 'var(--mint)' },
  CONVERTED:     { bg: 'rgba(31,229,163,0.12)',  border: 'rgba(31,229,163,0.30)',  label: 'var(--mint)' },
  LOST:          { bg: 'rgba(74,90,128,0.08)',   border: 'rgba(74,90,128,0.22)',   label: 'var(--muted)' },
};

const sourceColors = {
  WhatsApp: { bg: 'rgba(37,211,102,0.12)', color: '#25D366' },
  'Walk-in': { bg: 'rgba(45,168,240,0.12)', color: 'var(--cyan)' },
  Referral:  { bg: 'rgba(229,176,74,0.12)', color: 'var(--amber)' },
  Facebook:  { bg: 'rgba(24,119,242,0.12)', color: '#1877F2' },
  Website:   { bg: 'rgba(155,107,240,0.12)', color: 'var(--violet)' },
};

const ModalOverlay = ({ children, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}
  >
    <div onClick={e => e.stopPropagation()} style={{ width: '100%' }}>
      {children}
    </div>
  </div>
);

export default function LeadsView({ leads, setLeads, customers = [], onNavigate }) {
  const [viewMode, setViewMode] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [wonNotice, setWonNotice] = useState(null);

  const [newLead, setNewLead] = useState({
    name: '', phone: '', destination: '', source: 'WhatsApp', pax: '2', budget: '500000', notes: ''
  });

  // Won leads are converted to customer records by the API (README §5).
  const customerForLead = (lead) =>
    customers.find(c => c && (c.leadId === lead?.id || c.id === `CUST-${lead?.id}`)) || null;

  const filteredLeads = leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (l.name || '').toLowerCase().includes(q) || (l.phone || '').includes(q) || (l.destination || '').toLowerCase().includes(q);
    const matchesSource = selectedSource === 'ALL' || l.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  const handleAddLead = (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;
    const obj = {
      id: `LEAD-${1000 + leads.length + 1}`,
      name: newLead.name,
      phone: newLead.phone.startsWith('+') ? newLead.phone : `+92${newLead.phone.replace(/^0/, '')}`,
      whatsapp: newLead.phone.startsWith('+') ? newLead.phone : `+92${newLead.phone.replace(/^0/, '')}`,
      email: `${newLead.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      city: 'Lahore', source: newLead.source,
      destination: newLead.destination || 'Dubai, UAE',
      purpose: 'Outbound Tourism', travellerCount: parseInt(newLead.pax) || 1,
      budgetPKR: parseInt(newLead.budget) || 300000,
      requiredServices: ['Visa', 'Flight', 'Hotel'],
      assignedTo: 'Hamza Tariq', branchId: 'b-lhr', stage: 'NEW', priority: 'HIGH',
      nextFollowUp: 'Tomorrow 11:00 AM', notes: newLead.notes || 'Inquiry captured via SafarDesk portal.',
      createdDate: new Date().toISOString().split('T')[0]
    };
    setLeads([obj, ...leads]);
    setIsAddModalOpen(false);
    setNewLead({ name: '', phone: '', destination: '', source: 'WhatsApp', pax: '2', budget: '500000', notes: '' });
  };

  const updateLeadStage = (leadId, newStage) => {
    const lead = leads.find(l => l.id === leadId);
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, stage: newStage });
    if (newStage === 'CONFIRMED' && lead?.stage !== 'CONFIRMED') {
      setWonNotice({ leadId, name: lead?.name || 'this lead' });
      window.setTimeout(() => setWonNotice(current => (current?.leadId === leadId ? null : current)), 8000);
    }
  };

  const getWhatsAppLink = (lead) => {
    const phone = lead.phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Assalam-o-Alaikum ${lead.name},\nThank you for contacting SafarDesk. How can we assist you with your trip to ${lead.destination}?`);
    return `https://wa.me/${phone}?text=${msg}`;
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 9,
    background: 'var(--surface-2)', border: '1px solid var(--line-2)',
    color: 'var(--text)', fontFamily: 'var(--fb)', fontSize: 13, outline: 'none'
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 5 };
  const convertedCustomer = selectedLead ? customerForLead(selectedLead) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        paddingBottom: 20, borderBottom: '1px solid var(--line)'
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 4 }}>
            Leads & CRM Pipeline
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Manage WhatsApp enquiries, outbound visa leads, and conversion pipeline.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* View toggle */}
          <div style={{
            display: 'flex', gap: 2, padding: 3,
            borderRadius: 10, background: 'var(--surface)',
            border: '1px solid var(--line)'
          }}>
            {[{ id: 'kanban', label: 'Pipeline', icon: Kanban }, { id: 'table', label: 'Table', icon: TableIcon }].map(v => {
              const Icon = v.icon;
              const active = viewMode === v.id;
              return (
                <button key={v.id} onClick={() => setViewMode(v.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--fb)', fontSize: 12.5, fontWeight: 500,
                  background: active ? 'var(--mint-dim)' : 'transparent',
                  color: active ? 'var(--mint)' : 'var(--text-3)',
                  transition: 'all 0.18s'
                }}>
                  <Icon size={14} />
                  {v.label}
                </button>
              );
            })}
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-app-sm">
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="sd-input"
            style={{ paddingLeft: 34 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by client name, destination, phone…"
          />
        </div>
        <select className="sd-select" value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ minWidth: 140 }}>
          <option value="ALL">All Sources</option>
          {['WhatsApp', 'Walk-in', 'Referral', 'Facebook', 'Website'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Won → customer conversion notice */}
      {wonNotice && (
        <div role="status" aria-live="polite" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '11px 14px', borderRadius: 10,
          background: 'var(--mint-dim)', border: '1px solid rgba(31,229,163,0.3)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--mint)', fontWeight: 600 }}>
            <CheckCircle2 size={15} />
            {wonNotice.name} marked Confirmed / Won — the customer record is being saved automatically.
          </span>
          <button type="button" onClick={() => { setWonNotice(null); onNavigate('customers'); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(31,229,163,0.3)',
              color: 'var(--mint)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}>
            <Users size={13} /> Open customers
          </button>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
          {leadStages.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
            const sc = stageColors[stage.id] || stageColors.NEW;
            return (
              <div key={stage.id} style={{
                width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column',
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 14, maxHeight: 'calc(100vh - 22rem)', overflow: 'hidden'
              }}>
                {/* Column Header */}
                <div style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 13, color: sc.label
                  }}>{stage.title}</span>
                  <span style={{
                    fontFamily: 'var(--fm)', fontSize: 10.5, padding: '2px 8px',
                    borderRadius: 999, background: sc.bg, color: sc.label,
                    border: `1px solid ${sc.border}`
                  }}>{stageLeads.length}</span>
                </div>
                {/* Cards */}
                <div style={{ padding: '8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stageLeads.map(lead => {
                    const src = sourceColors[lead.source] || { bg: 'var(--surface-2)', color: 'var(--text-2)' };
                    return (
                      <div key={lead.id} onClick={() => setSelectedLead(lead)}
                        style={{
                          padding: '12px 13px', borderRadius: 10,
                          background: 'var(--surface-2)', border: '1px solid var(--line)',
                          cursor: 'pointer', transition: 'all 0.18s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                          <span style={{ fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{lead.name}</span>
                          <span style={{
                            fontFamily: 'var(--fm)', fontSize: 9.5, padding: '2px 7px',
                            borderRadius: 999, background: src.bg, color: src.color
                          }}>{lead.source}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 9 }}>
                          <div>{lead.destination} · {lead.travellerCount} Pax</div>
                          <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                            ₨{lead.budgetPKR?.toLocaleString()}
                          </div>
                        </div>
                        <div style={{
                          paddingTop: 8, borderTop: '1px solid var(--line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <a href={getWhatsAppLink(lead)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              fontSize: 11.5, fontWeight: 600, color: '#25D366',
                              textDecoration: 'none'
                            }}
                          >
                            <MessageSquare size={12} /> WhatsApp
                          </a>
                          <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text-3)' }}>
                            {lead.assignedTo?.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {stageLeads.length === 0 && (
                    <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                      No leads in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="sd-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="sd-table">
              <thead>
                <tr>
                  {['Lead ID', 'Client Name', 'Destination', 'Source', 'Budget (PKR)', 'Stage', 'Assigned To', 'Contact'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => {
                  const sc = stageColors[lead.stage] || stageColors.NEW;
                  const src = sourceColors[lead.source] || { bg: 'var(--surface-2)', color: 'var(--text-2)' };
                  return (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text-3)' }}>{lead.id}</td>
                      <td style={{ color: 'var(--text)', fontWeight: 600 }}>{lead.name}</td>
                      <td>{lead.destination}</td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--fm)', fontSize: 10.5, padding: '3px 8px',
                          borderRadius: 999, background: src.bg, color: src.color
                        }}>{lead.source}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--fm)' }}>₨{lead.budgetPKR?.toLocaleString()}</td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--fm)', fontSize: 10.5, padding: '3px 8px',
                          borderRadius: 999, background: sc.bg, color: sc.label,
                          border: `1px solid ${sc.border}`
                        }}>{lead.stage}</span>
                      </td>
                      <td>{lead.assignedTo}</td>
                      <td>
                        <a href={getWhatsAppLink(lead)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 8,
                            background: 'rgba(37,211,102,0.12)', color: '#25D366',
                            fontSize: 12, fontWeight: 600, textDecoration: 'none'
                          }}>
                          <MessageSquare size={12} /> Chat
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAD DETAIL DRAWER */}
      {selectedLead && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '100%', maxWidth: 440,
            background: 'var(--surface)', borderLeft: '1px solid var(--line-2)',
            padding: '24px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              paddingBottom: 16, borderBottom: '1px solid var(--line)'
            }}>
              <div>
                <span className="mono-eyebrow">{selectedLead.id}</span>
                <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginTop: 4 }}>
                  {selectedLead.name}
                </h2>
              </div>
              <button onClick={() => setSelectedLead(null)} style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line-2)',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Stage selector */}
            <div>
              <label style={labelStyle}>Pipeline Stage</label>
              <select className="sd-select" style={{ width: '100%' }}
                value={selectedLead.stage}
                onChange={e => updateLeadStage(selectedLead.id, e.target.value)}
              >
                {leadStages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {/* Won → customer conversion */}
            {selectedLead.stage === 'CONFIRMED' && (
              <div role="status" aria-live="polite" style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'var(--mint-dim)', border: '1px solid rgba(31,229,163,0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--mint)' }}>
                  <CheckCircle2 size={14} />
                  {convertedCustomer ? 'Saved to Customers' : 'Saving customer record…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 5, lineHeight: 1.5 }}>
                  {convertedCustomer
                    ? <>Customer <span style={{ fontFamily: 'var(--fm)', color: 'var(--text)' }}>{convertedCustomer.id}</span> created from this won lead.</>
                    : 'This won lead becomes a customer record automatically (idempotent — one record per lead).'}
                </div>
                <button type="button" onClick={() => { setSelectedLead(null); onNavigate('customers'); }}
                  style={{
                    marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(31,229,163,0.3)',
                    color: 'var(--mint)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>
                  <Users size={13} /> View in customers
                </button>
              </div>
            )}

            {/* Details grid */}
            <div className="sd-card-2" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                { label: 'Phone / WhatsApp', value: selectedLead.phone, mono: true },
                { label: 'Destination', value: selectedLead.destination },
                { label: 'Pax Count', value: `${selectedLead.travellerCount} Persons` },
                { label: 'Budget Estimate', value: `PKR ${selectedLead.budgetPKR?.toLocaleString()}`, mono: true },
                { label: 'Next Follow-up', value: selectedLead.nextFollowUp, color: 'var(--amber)' },
                { label: 'Source', value: selectedLead.source },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)' }}>{row.label}</span>
                  <span style={{
                    fontFamily: row.mono ? 'var(--fm)' : 'var(--fb)',
                    color: row.color || 'var(--text)', fontWeight: 600
                  }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label style={labelStyle}>Requirements & Notes</label>
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6
              }}>{selectedLead.notes}</div>
            </div>

            {/* Actions */}
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={getWhatsAppLink(selectedLead)} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', borderRadius: 10,
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: '#fff', fontFamily: 'var(--fb)', fontWeight: 600, fontSize: 13.5,
                  textDecoration: 'none'
                }}>
                <MessageSquare size={16} /> Open WhatsApp Chat
              </a>
              <button onClick={() => { setSelectedLead(null); onNavigate('quotations'); }}
                className="btn-secondary">
                Create Quotation <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {isAddModalOpen && (
        <ModalOverlay onClose={() => setIsAddModalOpen(false)}>
          <div style={{
            maxWidth: 520, margin: '0 auto',
            background: 'var(--surface)', border: '1px solid var(--line-2)',
            borderRadius: 18, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: 16, borderBottom: '1px solid var(--line)'
            }}>
              <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                New Travel Inquiry / Lead
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line-2)',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Client Full Name *</label>
                  <input className="sd-input" required value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="Mian Tariq Mehmood" />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp / Mobile *</label>
                  <input className="sd-input" required value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="03001234567" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Destination Country</label>
                  <input className="sd-input" value={newLead.destination}
                    onChange={e => setNewLead({ ...newLead, destination: e.target.value })}
                    placeholder="Dubai, London, Istanbul" />
                </div>
                <div>
                  <label style={labelStyle}>Inquiry Source</label>
                  <select className="sd-select" style={{ width: '100%' }} value={newLead.source}
                    onChange={e => setNewLead({ ...newLead, source: e.target.value })}>
                    {['WhatsApp', 'Walk-in', 'Facebook', 'Referral', 'Website'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Traveller Count (Pax)</label>
                  <input className="sd-input" type="number" min="1" value={newLead.pax}
                    onChange={e => setNewLead({ ...newLead, pax: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Budget Estimate (PKR)</label>
                  <input className="sd-input" type="number" step="10000" value={newLead.budget}
                    onChange={e => setNewLead({ ...newLead, budget: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes & Requirements</label>
                <textarea className="sd-input" rows="3" value={newLead.notes}
                  onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="e.g. 5-star hotel near Haram, Umrah visas for 4 pax…"
                  style={{ resize: 'vertical', minHeight: 72 }} />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                paddingTop: 14, borderTop: '1px solid var(--line)'
              }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-ghost-sm">Cancel</button>
                <button type="submit" className="btn-app-sm">Save Lead</button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
