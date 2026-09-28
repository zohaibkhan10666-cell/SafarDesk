import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderLock,
  Calculator,
  PlaneTakeoff,
  CreditCard,
  Truck,
  BarChart3,
  Settings,
  MessageSquare,
  Package,
  CheckSquare,
  Globe,
  Building2,
  Layers,
  Award,
  Lock,
  X
} from 'lucide-react';
import { allowedTabsFor, roleTabs } from '../lib/access';

const allNavItems = [
  { id: 'dashboard',   label: 'Command Center',        icon: LayoutDashboard, group: 'overview' },
  { id: 'superadmin',  label: 'Platform Console',      icon: Building2,       group: 'overview' },
  { id: 'cases',       label: 'Travel Cases (360°)',   icon: Layers,          group: 'operations' },
  { id: 'subagent',    label: 'Sub-Agent Portal',      icon: Award,           group: 'sales' },
  { id: 'portal',      label: 'Customer Portal',       icon: Globe,           group: 'overview' },
  { id: 'leads',       label: 'Leads & CRM',           icon: MessageSquare,   group: 'sales', badgeKey: 'leads', badgeColor: 'mint' },
  { id: 'tasks',       label: 'Tasks & Follow-ups',    icon: CheckSquare,     group: 'sales', badgeKey: 'tasks', badgeColor: 'amber' },
  { id: 'customers',   label: 'Customers & Travellers', icon: Users,           group: 'sales', badgeKey: 'warnings', badgeColor: 'amber' },
  { id: 'visa',        label: 'Visa Cases',             icon: FileText,        group: 'operations', badgeKey: 'visaCases', badgeColor: 'cyan' },
  { id: 'vault',       label: 'Document Vault',         icon: FolderLock,      group: 'operations' },
  { id: 'quotations',  label: 'Quotations & Pricing',   icon: Calculator,      group: 'operations' },
  { id: 'packages',    label: 'Package Builder',        icon: Package,         group: 'operations' },
  { id: 'bookings',    label: 'Bookings & Trips',       icon: PlaneTakeoff,    group: 'operations', badgeKey: 'bookings', badgeColor: 'blue' },
  { id: 'finance',     label: 'Finance & Payments',     icon: CreditCard,      group: 'finance', badgeKey: 'overdue', badgeColor: 'red' },
  { id: 'suppliers',   label: 'Suppliers & Balances',   icon: Truck,           group: 'finance' },
  { id: 'reports',     label: 'Analytics & Reports',    icon: BarChart3,       group: 'admin' },
  { id: 'settings',    label: 'Agency & Plans',         icon: Settings,        group: 'admin' },
];

const allGroups = [
  { key: 'overview',    label: 'Overview' },
  { key: 'sales',       label: 'Sales & CRM' },
  { key: 'operations',  label: 'Operations' },
  { key: 'finance',     label: 'Finance' },
  { key: 'admin',       label: 'System' },
];

const badgeStyles = {
  mint:  { background: 'var(--mint-dim)',  color: 'var(--mint)',  border: '1px solid rgba(31,229,163,0.25)' },
  cyan:  { background: 'var(--cyan-dim)',  color: 'var(--cyan)',  border: '1px solid rgba(45,168,240,0.25)' },
  blue:  { background: 'var(--blue-dim)',  color: 'var(--cyan)',  border: '1px solid rgba(40,84,224,0.25)' },
  amber: { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(229,176,74,0.25)' },
  red:   { background: 'var(--red-dim)',   color: 'var(--red)',   border: '1px solid rgba(240,74,90,0.25)' },
};

export default function Sidebar({ activeTab, setActiveTab, counts, isOpen, onClose, currentRole, planModules = null, planId = null }) {
  // Role modules (README §15) intersected with the plan's modules (README §19.1)
  const allowedItemIds = allowedTabsFor(currentRole, planModules, planId);
  const roleItemIds = roleTabs(currentRole);

  const navItems = allNavItems.filter(item => roleItemIds.includes(item.id));
  const groups = allGroups.filter(group => navItems.some(i => i.group === group.key));
  return (
    <>
      <aside style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        borderRight: '1px solid var(--line)',
        height: 'calc(100vh - 56px)',
        position: 'sticky',
        top: 56,
        overflowY: 'auto',
        transition: 'transform 0.3s cubic-bezier(0.2,0.7,0.2,1)',
        // Mobile: slide in from left; Desktop: always visible
        ...(typeof window !== 'undefined' && window.innerWidth < 768 ? {
          position: 'fixed',
          top: 56,
          left: 0,
          zIndex: 25,
          height: 'calc(100vh - 56px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        } : {})
      }}
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky md:flex`}
      >
        <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          {/* Mobile close button */}
          <div className="flex justify-end md:hidden mb-2">
            <button onClick={onClose} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--line-2)',
              color: 'var(--text-2)', cursor: 'pointer'
            }}>
              <X size={16} />
            </button>
          </div>

          {groups.map(group => {
            const items = navItems.filter(i => i.group === group.key);
            return (
              <div key={group.key} style={{ marginBottom: 4 }}>
                <div style={{
                  padding: '10px 10px 5px',
                  fontFamily: 'var(--fm)',
                  fontSize: 9.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--text-3)',
                  fontWeight: 500
                }}>
                  {group.label}
                </div>

                {items.map(item => {
                  const Icon = item.icon;
                  const locked = !allowedItemIds.includes(item.id);
                  const isActive = !locked && activeTab === item.id;
                  const badgeCount = item.badgeKey ? counts[item.badgeKey] : null;
                  const showBadge = !locked && badgeCount && badgeCount > 0;
                  const ItemIcon = locked ? Lock : Icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      disabled={locked}
                      title={locked ? 'Locked — not included in this subscription plan' : undefined}
                      style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 9,
                        marginBottom: 2,
                        cursor: locked ? 'not-allowed' : 'pointer',
                        border: 'none',
                        textAlign: 'left',
                        opacity: locked ? 0.45 : 1,
                        background: isActive
                          ? 'linear-gradient(90deg, rgba(31,229,163,0.12), rgba(45,168,240,0.08))'
                          : 'transparent',
                        transition: 'all 0.18s ease',
                        outline: 'none',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Active left-border accent */}
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          left: 0, top: '50%', transform: 'translateY(-50%)',
                          width: 3, height: 18,
                          background: 'linear-gradient(180deg, var(--mint), var(--cyan))',
                          borderRadius: '0 3px 3px 0'
                        }} />
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: isActive ? 4 : 0 }}>
                        <ItemIcon
                          size={16}
                          style={{
                            color: isActive ? 'var(--mint)' : 'var(--text-3)',
                            flexShrink: 0,
                            transition: 'color 0.18s'
                          }}
                        />
                        <span style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          fontFamily: 'var(--fb)',
                          color: isActive ? 'var(--text)' : 'var(--text-2)',
                          transition: 'color 0.18s',
                          lineHeight: 1
                        }}>
                          {item.label}
                        </span>
                      </div>

                      {showBadge && (
                        <span style={{
                          fontFamily: 'var(--fm)',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 999,
                          ...(badgeStyles[item.badgeColor] || badgeStyles.mint)
                        }}>
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer — System Status */}
        <div style={{
          padding: 12,
          borderTop: '1px solid var(--line)',
          flexShrink: 0
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(31,229,163,0.08), rgba(45,168,240,0.06))',
            border: '1px solid rgba(31,229,163,0.16)',
            borderRadius: 10,
            padding: '10px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{
                fontFamily: 'var(--fd)', fontWeight: 600, fontSize: 12, color: 'var(--text)'
              }}>SafarDesk Cloud</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--mint)', fontWeight: 600 }}>
                <span className="pulse-mint" />
                Live
              </span>
            </div>
            <p style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5 }}>
              Tenant isolated · PKT (UTC+5)
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
