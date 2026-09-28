import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Bell,
  ShieldCheck,
  MapPin,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Plane,
  Menu,
  X,
  Zap,
  Lock,
  LogOut
} from 'lucide-react';
import { api } from '../lib/api';

export default function Navbar({
  currentBranch,
  setCurrentBranch,
  branches,
  currentRole,
  setCurrentRole,
  onOpenCommandPalette,
  onMenuToggle,
  onSignOut,
  sessionUser = null,
  planId = null
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Role categories the current plan grants (README §19.1 · plan role access).
  const [allowedRoles, setAllowedRoles] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.entitlements.get()
      .then(data => {
        if (!cancelled && Array.isArray(data?.allowedRoles) && data.allowedRoles.length) {
          setAllowedRoles(data.allowedRoles);
        }
      })
      .catch(() => {
        // No API on this route — every simulated role stays selectable.
      });
    return () => { cancelled = true; };
  }, []);

  const roleAllowed = (roleId) =>
    roleId === 'SUPER_ADMIN' || !allowedRoles || allowedRoles.includes(roleId);

  // Role simulation is a platform-console tool (README §19.7): only a signed-in
  // Super Admin sees the switcher. The gate reads the session identity rather
  // than the simulated role, so a Super Admin who is testing another role can
  // always switch back — nobody else ever renders the control.
  const canSimulateRoles = sessionUser?.role === 'SUPER_ADMIN';

  const notifications = [
    { id: 1, type: 'warning', title: 'Passport Expiry Warning', desc: 'Daniyal Kamran passport expires in 28 days', time: '10m ago' },
    { id: 2, type: 'info',    title: 'Visa Checklist Updated',  desc: 'Dr. Samina Pervez submitted UK Bank Statement', time: '35m ago' },
    { id: 3, type: 'alert',   title: 'Overdue Installment',     desc: 'PKR 185,000 balance overdue — SFD-BKG-9921', time: '1h ago' }
  ];

  const roles = [
    { id: 'SUPER_ADMIN',       label: 'Super Admin',           badge: 'Platform Root' },
    { id: 'AGENCY_OWNER',      label: 'Agency Owner / CEO',    badge: 'Full Admin' },
    { id: 'AGENCY_MANAGER',    label: 'General Manager',       badge: 'Operations & Team' },
    { id: 'TRAVEL_CONSULTANT', label: 'Travel Consultant',      badge: 'Sales & CRM' },
    { id: 'VISA_OFFICER',      label: 'Visa Officer',           badge: 'Visa & Vault' },
    { id: 'ACCOUNTANT',        label: 'Chief Accountant',       badge: 'Finance & P&L' },
    { id: 'OPERATIONS_STAFF',  label: 'Operations Specialist',  badge: 'Bookings & Trips' },
    { id: 'BRANCH_MANAGER',    label: 'Branch Manager',         badge: 'Branch Scoped' },
    { id: 'SUB_AGENT',         label: 'B2B Sub-Agent',          badge: 'External Partner' },
    { id: 'CUSTOMER',          label: 'Customer Client Portal', badge: 'Public Tracking' }
  ];

  const closeAll = () => {
    setShowRoleMenu(false);
    setShowBranchMenu(false);
    setShowNotifications(false);
    setShowAccount(false);
  };

  const dropdownBase = {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    background: 'var(--surface-2)',
    border: '1px solid var(--line-2)',
    borderRadius: '12px',
    boxShadow: '0 24px 48px -12px rgba(0,0,0,0.55)',
    zIndex: 50,
    animation: 'fade-in .15s ease forwards'
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      padding: '0 20px',
      background: 'rgba(11,18,50,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--line)',
      gap: 12
    }}>

      {/* Left: Mobile Menu + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--line-2)',
            color: 'var(--text-2)',
            cursor: 'pointer'
          }}
        >
          <Menu size={18} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--mint), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(31,229,163,0.35)',
            flexShrink: 0
          }}>
            <Plane size={16} style={{ color: '#051020', transform: 'rotate(-45deg)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 15,
              letterSpacing: '-0.03em', color: 'var(--text)'
            }}>
              SafarDesk<span style={{ color: 'var(--mint)' }}>.</span>
            </span>
            <span style={{
              fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--text-3)',
              marginTop: 2
            }} className="hidden md:block">
              Travel & Visa ERP
            </span>
          </div>
        </div>

        {/* Branch Selector */}
        <div style={{ position: 'relative' }} className="hidden sm:block">
          <button
            onClick={() => { closeAll(); setShowBranchMenu(!showBranchMenu); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--line-2)',
              color: 'var(--text-2)', fontSize: 12.5,
              fontFamily: 'var(--fb)', cursor: 'pointer',
              transition: 'all 0.18s'
            }}
          >
            <MapPin size={13} style={{ color: 'var(--mint)' }} />
            <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentBranch.name}
            </span>
            <ChevronDown size={12} />
          </button>

          {showBranchMenu && (
            <div style={{ ...dropdownBase, left: 0, width: 260, padding: '6px' }}>
              <div style={{
                padding: '4px 10px 8px',
                fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--text-3)'
              }}>Select Branch Scope</div>
              <button onClick={() => { setCurrentBranch({ id: 'ALL', name: 'All Branches (Consolidated)', manager: 'Headquarters' }); setShowBranchMenu(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8, textAlign: 'left',
                  background: currentBranch.id === 'ALL' ? 'var(--mint-dim)' : 'transparent',
                  border: currentBranch.id === 'ALL' ? '1px solid rgba(31,229,163,0.22)' : '1px solid transparent',
                  color: currentBranch.id === 'ALL' ? 'var(--mint)' : 'var(--text-2)',
                  cursor: 'pointer', marginBottom: 2,
                  transition: 'all 0.15s'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--fb)' }}>All Branches (Consolidated)</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Multi-Branch Enterprise View</div>
                </div>
                {currentBranch.id === 'ALL' && <CheckCircle2 size={14} />}
              </button>
              {branches.map(b => (
                <button key={b.id} onClick={() => { setCurrentBranch(b); setShowBranchMenu(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, textAlign: 'left',
                    background: currentBranch.id === b.id ? 'var(--mint-dim)' : 'transparent',
                    border: currentBranch.id === b.id ? '1px solid rgba(31,229,163,0.22)' : '1px solid transparent',
                    color: currentBranch.id === b.id ? 'var(--mint)' : 'var(--text-2)',
                    cursor: 'pointer', marginBottom: 2,
                    transition: 'all 0.15s'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--fb)' }}>{b.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{b.manager} · {b.phone}</div>
                  </div>
                  {currentBranch.id === b.id && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex" style={{ flex: 1, maxWidth: 420, margin: '0 16px' }}>
        <button
          onClick={onOpenCommandPalette}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--line-2)',
            color: 'var(--text-3)', fontSize: 13,
            fontFamily: 'var(--fb)', cursor: 'pointer',
            transition: 'all 0.18s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(31,229,163,0.35)'; e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Search size={14} />
            <span>Search leads, PNRs, passports, visa cases…</span>
          </div>
          <kbd style={{
            fontFamily: 'var(--fm)', fontSize: 10, padding: '3px 7px',
            borderRadius: 6, border: '1px solid var(--line-2)',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)'
          }}>Ctrl K</kbd>
        </button>
      </div>

      {/* Right: Role + Notifications + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Role Switcher — Super Admin session only (README §19.7) */}
        {canSimulateRoles && (
        <div style={{ position: 'relative' }} className="hidden md:block">
          <button
            onClick={() => { closeAll(); setShowRoleMenu(!showRoleMenu); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--line-2)',
              color: 'var(--text-2)', fontSize: 12.5,
              fontFamily: 'var(--fb)', cursor: 'pointer'
            }}
          >
            <ShieldCheck size={13} style={{ color: 'var(--cyan)' }} />
            <span>{roles.find(r => r.id === currentRole)?.badge || 'Role'}</span>
            <ChevronDown size={12} />
          </button>

          {showRoleMenu && (
            <div style={{ ...dropdownBase, right: 0, width: 240, padding: '6px' }}>
              <div style={{
                padding: '4px 10px 8px',
                fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--text-3)'
              }}>Simulate Role (RBAC)</div>
              {roles.map(r => {
                const selectable = roleAllowed(r.id);
                const reason = selectable ? r.badge : 'Not in plan — locked by plan role access';
                return (
                  <button
                    key={r.id}
                    onClick={() => { if (!selectable) return; setCurrentRole(r.id); setShowRoleMenu(false); }}
                    disabled={!selectable}
                    aria-disabled={!selectable}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8, textAlign: 'left',
                      background: currentRole === r.id ? 'var(--mint-dim)' : 'transparent',
                      border: currentRole === r.id ? '1px solid rgba(31,229,163,0.22)' : '1px solid transparent',
                      color: !selectable ? 'var(--text-3)' : currentRole === r.id ? 'var(--mint)' : 'var(--text-2)',
                      opacity: selectable ? 1 : 0.6,
                      cursor: selectable ? 'pointer' : 'not-allowed', marginBottom: 2, transition: 'all 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--fb)' }}>{r.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{reason}</div>
                    </div>
                    {currentRole === r.id ? <CheckCircle2 size={14} /> : !selectable ? <Lock size={14} /> : null}
                  </button>
                );
              })}
              <div style={{
                padding: '8px 10px 4px', marginTop: 4, borderTop: '1px solid var(--line)',
                fontSize: 10, lineHeight: 1.5, color: 'var(--text-3)'
              }}>
                Simulation is available to Super Admin only.
              </div>
            </div>
          )}
        </div>
        )}

        {/* Mobile search button */}
        <button
          onClick={onOpenCommandPalette}
          className="lg:hidden"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--line-2)',
            color: 'var(--text-2)', cursor: 'pointer'
          }}
        >
          <Search size={16} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { closeAll(); setShowNotifications(!showNotifications); }}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--line-2)',
              color: 'var(--text-2)', cursor: 'pointer'
            }}
          >
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: 8, right: 8,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--red)',
              boxShadow: '0 0 0 2px var(--navy)'
            }} className="pulse-red" />
          </button>

          {showNotifications && (
            <div style={{ ...dropdownBase, right: 0, width: 320, padding: '0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid var(--line)'
              }}>
                <span style={{ fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                  System Alerts
                </span>
                <span style={{
                  fontFamily: 'var(--fm)', fontSize: 10, padding: '2px 8px',
                  borderRadius: 999, background: 'var(--red-dim)', color: 'var(--red)',
                  border: '1px solid rgba(240,74,90,0.25)'
                }}>3 Unread</span>
              </div>
              <div style={{ padding: '6px' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                    cursor: 'pointer', transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: n.type === 'warning' ? 'var(--amber-dim)' : n.type === 'alert' ? 'var(--red-dim)' : 'var(--cyan-dim)',
                        border: `1px solid ${n.type === 'warning' ? 'rgba(229,176,74,0.25)' : n.type === 'alert' ? 'rgba(240,74,90,0.25)' : 'rgba(45,168,240,0.25)'}`
                      }}>
                        <AlertTriangle size={13} style={{ color: n.type === 'warning' ? 'var(--amber)' : n.type === 'alert' ? 'var(--red)' : 'var(--cyan)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text)', fontFamily: 'var(--fb)' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.4 }}>{n.desc}</div>
                        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{n.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { closeAll(); setShowAccount(!showAccount); }}
            aria-label={showAccount ? 'Close account menu' : 'Open account menu'}
            aria-expanded={showAccount}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--blue), var(--violet))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 12,
              color: '#fff', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 0 12px rgba(40,84,224,0.4)',
              border: '2px solid rgba(255,255,255,0.10)'
            }}
          >
            {sessionUser?.avatar || 'BA'}
          </button>

          {showAccount && (
            <div style={{ ...dropdownBase, right: 0, width: 250, padding: '10px 12px 12px' }}>
              <div style={{
                fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--text-3)', marginBottom: 8
              }}>Signed in</div>
              <div style={{ fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                {sessionUser?.name || 'Bilal Ahmed'}
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text-2)', marginTop: 2, wordBreak: 'break-all' }}>
                {sessionUser?.email || '—'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--fm)', fontSize: 10, padding: '3px 8px', borderRadius: 999,
                  background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid rgba(45,168,240,0.25)'
                }}>{roles.find(r => r.id === currentRole)?.badge || currentRole}</span>
                {planId && (
                  <span style={{
                    fontFamily: 'var(--fm)', fontSize: 10, padding: '3px 8px', borderRadius: 999,
                    background: 'var(--mint-dim)', color: 'var(--mint)', border: '1px solid rgba(31,229,163,0.25)'
                  }}>{planId}</span>
                )}
              </div>
              <button
                onClick={() => { setShowAccount(false); if (onSignOut) onSignOut(); }}
                type="button"
                style={{
                  width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '9px 12px', borderRadius: 9,
                  background: 'var(--red-dim)', border: '1px solid rgba(240,74,90,0.3)',
                  color: 'var(--red)', fontSize: 12.5, fontFamily: 'var(--fb)', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside closer */}
      {(showBranchMenu || showRoleMenu || showNotifications || showAccount) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={closeAll} />
      )}
    </header>
  );
}
