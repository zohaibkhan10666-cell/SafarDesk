import React from 'react';
import {
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plane,
  ArrowUpRight,
  TrendingUp,
  Plus,
  MessageSquare,
  FileCheck,
  DollarSign,
  Activity,
  Compass
} from 'lucide-react';

export default function DashboardView({
  currentBranch,
  leads,
  customers,
  visaCases,
  bookings,
  payments,
  onNavigate,
  onOpenQuickAction
}) {
  const totalLeads = leads.length;
  const activeVisaCases = visaCases.filter(v => v.status !== 'APPROVED' && v.status !== 'REJECTED').length;
  const pendingDocsCount = visaCases.reduce((acc, v) =>
    acc + v.checklists.filter(c => c.status === 'PENDING' || c.status === 'UPLOADED').length, 0);
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
  const totalReceivablesPKR = bookings.reduce((acc, b) => acc + (b.balanceAmountPKR || 0), 0);
  const totalGrossMarginPKR = bookings.reduce((acc, b) => acc + Math.round(b.totalAmountPKR * 0.14), 0);
  const totalRevenuePKR = bookings.reduce((acc, b) => acc + (b.totalAmountPKR || 0), 0);

  const activeDepartures = [
    { id: 'DEP-1', customer: 'Chaudhry Kamran & Family', pax: 4, destination: 'Dubai, UAE', date: 'Oct 15, 2026', pnr: 'EK-8942-LHR', flightStatus: 'On-Time', visaStatus: 'In Review', statusColor: 'cyan' },
    { id: 'DEP-2', customer: 'Haji M. Rasheed & Family', pax: 4, destination: 'Jeddah / Madinah, KSA', date: 'Oct 02, 2026', pnr: 'SV-4421-JED', flightStatus: 'Confirmed', visaStatus: 'Ready to Submit', statusColor: 'mint' },
  ];

  const kpis = [
    {
      label: 'Active Leads',
      value: totalLeads,
      sub: '+3 new today',
      subColor: 'var(--mint)',
      icon: MessageSquare,
      iconColor: 'var(--mint)',
      accentColor: 'var(--mint-dim)',
      tab: 'leads'
    },
    {
      label: 'Visa Pipeline',
      value: activeVisaCases,
      sub: 'Dubai · UK · KSA',
      subColor: 'var(--cyan)',
      icon: FileText,
      iconColor: 'var(--cyan)',
      accentColor: 'var(--cyan-dim)',
      tab: 'visa'
    },
    {
      label: 'Pending Docs',
      value: pendingDocsCount,
      sub: 'Verification needed',
      subColor: 'var(--amber)',
      icon: FileCheck,
      iconColor: 'var(--amber)',
      accentColor: 'var(--amber-dim)',
      tab: 'vault'
    },
    {
      label: 'Confirmed Trips',
      value: confirmedBookings,
      sub: '100% PNRs ticketed',
      subColor: 'var(--blue)',
      icon: Plane,
      iconColor: 'var(--blue)',
      accentColor: 'var(--blue-dim)',
      tab: 'bookings'
    },
    {
      label: 'Receivables',
      value: `₨${(totalReceivablesPKR / 1000).toFixed(0)}k`,
      sub: 'PKR 185k Overdue',
      subColor: 'var(--red)',
      icon: Clock,
      iconColor: 'var(--red)',
      accentColor: 'var(--red-dim)',
      tab: 'finance'
    },
    {
      label: 'Gross Margin',
      value: `₨${(totalGrossMarginPKR / 1000).toFixed(0)}k`,
      sub: 'Avg 14% yield',
      subColor: 'var(--mint)',
      icon: TrendingUp,
      iconColor: 'var(--mint)',
      accentColor: 'var(--mint-dim)',
      tab: 'reports'
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Hero Section ── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        padding: '32px 36px',
      }}>
        {/* Mesh gradient overlay */}
        <div className="mesh-gradient-hero" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          borderRadius: 'inherit'
        }} />
        {/* Ambient orb */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(31,229,163,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ maxWidth: 580 }}>
            {/* Live badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 13px',
              borderRadius: 999,
              background: 'rgba(31,229,163,0.10)',
              border: '1px solid rgba(31,229,163,0.22)',
              marginBottom: 16
            }}>
              <span className="pulse-mint" />
              <span style={{
                fontFamily: 'var(--fm)', fontSize: 10.5, letterSpacing: '0.10em',
                textTransform: 'uppercase', color: 'var(--mint)', fontWeight: 500
              }}>
                {currentBranch.name} · Live Operations
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)',
              letterSpacing: '-0.04em', lineHeight: 1.15, color: 'var(--text)',
              marginBottom: 10
            }}>
              Travel & Visa{' '}
              <span className="text-gradient-mint">Command Center</span>
            </h1>

            <p style={{
              fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 480
            }}>
              Real-time pipeline for Pakistani outbound consulting — visa verifications, PNR tracking, and PKR billing reconciliation in one place.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onOpenQuickAction('NEW_LEAD')} className="btn-primary-pill">
              <Plus size={15} />
              New Lead
            </button>
            <button onClick={() => onOpenQuickAction('NEW_VISA')} className="btn-secondary-pill">
              <FileText size={15} style={{ color: 'var(--cyan)' }} />
              New Visa Case
            </button>
          </div>
        </div>

        {/* Stats band inside hero */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexWrap: 'wrap', gap: 28,
          marginTop: 28, paddingTop: 24,
          borderTop: '1px solid var(--line)'
        }}>
          {[
            { label: 'Total Revenue (MTD)', value: `₨${(totalRevenuePKR / 100000).toFixed(1)}L`, color: 'var(--mint)' },
            { label: 'Active Customers', value: customers.length, color: 'var(--cyan)' },
            { label: 'Visa Approval Rate', value: '94%', color: 'var(--blue)' },
            { label: 'Avg. Package Value', value: '₨195k', color: 'var(--amber)' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{
                fontFamily: 'var(--fd)', fontWeight: 700,
                fontSize: 'clamp(20px, 2.5vw, 28px)',
                letterSpacing: '-0.04em', color: stat.color
              }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--fb)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KPI Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14
      }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <button
              key={i}
              onClick={() => onNavigate(kpi.tab)}
              className="sd-card sd-hover-lift"
              style={{
                padding: '18px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = kpi.iconColor;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${kpi.iconColor}22, 0 16px 40px -16px rgba(0,0,0,0.4)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--line)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="mono-eyebrow">{kpi.label}</span>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: kpi.accentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} style={{ color: kpi.iconColor }} />
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--fd)', fontWeight: 700,
                fontSize: 26, letterSpacing: '-0.04em',
                color: 'var(--text)', lineHeight: 1
              }}>
                {kpi.value}
              </div>
              <div style={{
                fontSize: 11.5, fontWeight: 500,
                color: kpi.subColor, marginTop: 4
              }}>
                {kpi.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Departures + Alerts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }} className="lg:grid-cols-[1fr_340px]">

        {/* Departures Tracker */}
        <div className="sd-card" style={{ padding: 22 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--line)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'var(--cyan-dim)',
                border: '1px solid rgba(45,168,240,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Compass size={15} style={{ color: 'var(--cyan)' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                  Upcoming Departures
                </h2>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
                  DUTY OF CARE TRACKER · OCT 2026
                </span>
              </div>
            </div>
            <button onClick={() => onNavigate('bookings')} className="btn-ghost-sm">
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeDepartures.map(dep => (
              <div key={dep.id} style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                display: 'flex', flexWrap: 'wrap',
                alignItems: 'center', justifyContent: 'space-between',
                gap: 12,
                transition: 'border-color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 13, color: 'var(--text)'
                    }}>{dep.customer}</span>
                    <span style={{
                      fontFamily: 'var(--fm)', fontSize: 10, padding: '2px 8px',
                      borderRadius: 999, background: 'var(--blue-dim)',
                      color: 'var(--cyan)', border: '1px solid rgba(40,84,224,0.25)'
                    }}>{dep.pax} Pax · {dep.destination}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap'
                  }}>
                    <span>Dep: <strong style={{ color: 'var(--text)' }}>{dep.date}</strong></span>
                    <span style={{ color: 'var(--muted)' }}>·</span>
                    <span style={{ fontFamily: 'var(--fm)' }}>
                      PNR: <strong style={{ color: 'var(--cyan)' }}>{dep.pnr}</strong>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: 'var(--fm)', fontSize: 11, padding: '4px 10px',
                    borderRadius: 999,
                    background: dep.statusColor === 'mint' ? 'var(--mint-dim)' : 'var(--cyan-dim)',
                    color: dep.statusColor === 'mint' ? 'var(--mint)' : 'var(--cyan)',
                    border: dep.statusColor === 'mint' ? '1px solid rgba(31,229,163,0.25)' : '1px solid rgba(45,168,240,0.25)'
                  }}>
                    ✓ {dep.flightStatus}
                  </span>
                  <button onClick={() => onNavigate('bookings')} className="btn-ghost-sm">
                    View Trip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="sd-card" style={{ padding: 22 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--line)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'var(--red-dim)',
                border: '1px solid rgba(240,74,90,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Activity size={15} style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                  Critical Alerts
                </h2>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--red)', letterSpacing: '0.08em' }}>
                  2 ACTIONS REQUIRED
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Alert 1: Passport */}
            <div style={{
              padding: '14px 14px',
              borderRadius: 12,
              background: 'rgba(229,176,74,0.07)',
              border: '1px solid rgba(229,176,74,0.22)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertTriangle size={13} style={{ color: 'var(--amber)' }} />
                  <span style={{
                    fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 12.5, color: 'var(--amber)'
                  }}>Passport Expiry Warning</span>
                </div>
                <span style={{
                  fontFamily: 'var(--fm)', fontSize: 9.5, padding: '2px 7px',
                  borderRadius: 999, background: 'rgba(229,176,74,0.2)',
                  color: 'var(--amber)'
                }}>Urgent</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
                Daniyal Kamran (child) passport expires in <strong style={{ color: 'var(--text)' }}>28 days</strong>.
                Required for UAE GDRFA visa approval.
              </p>
              <button
                onClick={() => onNavigate('customers')}
                style={{
                  marginTop: 10, display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: 'var(--amber)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0
                }}
              >
                Contact on WhatsApp <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Alert 2: Overdue */}
            <div style={{
              padding: '14px 14px',
              borderRadius: 12,
              background: 'rgba(240,74,90,0.07)',
              border: '1px solid rgba(240,74,90,0.22)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <DollarSign size={13} style={{ color: 'var(--red)' }} />
                  <span style={{
                    fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 12.5, color: 'var(--red)'
                  }}>Outstanding Balance</span>
                </div>
                <span style={{
                  fontFamily: 'var(--fm)', fontSize: 9.5, padding: '2px 7px',
                  borderRadius: 999, background: 'rgba(240,74,90,0.2)',
                  color: 'var(--red)'
                }}>PKR 185k</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
                Dubai Package <strong style={{ fontFamily: 'var(--fm)', color: 'var(--text)' }}>SFD-BKG-9921</strong> final installment overdue since yesterday.
              </p>
              <button
                onClick={() => onNavigate('finance')}
                style={{
                  marginTop: 10, display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: 'var(--red)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0
                }}
              >
                Record Payment <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
