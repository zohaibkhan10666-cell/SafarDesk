import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import DashboardView from './components/DashboardView';
import LeadsView from './components/LeadsView';
import CustomersView from './components/CustomersView';
import VisaCasesView from './components/VisaCasesView';
import DocumentVaultView from './components/DocumentVaultView';
import QuotationsView from './components/QuotationsView';
import PackagesView from './components/PackagesView';
import BookingsView from './components/BookingsView';
import TasksView from './components/TasksView';
import FinanceView from './components/FinanceView';
import SuppliersView from './components/SuppliersView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import SuperAdminView from './components/SuperAdminView';
import TravelCasesView from './components/TravelCasesView';
import SubAgentView from './components/SubAgentView';
import CustomerPortalView from './components/CustomerPortalView';
import WhatsAppModal from './components/WhatsAppModal';
import PublicSite from './components/PublicSite';

import { 
  initialAgencyData, 
  initialLeads, 
  initialCustomers, 
  initialVisaCases, 
  initialQuotations, 
  initialBookings, 
  initialPayments,
  initialTasks 
} from './data/mockData';

import { api, setToken, getToken } from './lib/api';
import { allowedTabsFor } from './lib/access';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planModules, setPlanModules] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionNotice, setSessionNotice] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentBranch, setCurrentBranch] = useState(initialAgencyData.branches[0]);
  const [currentRole, setCurrentRole] = useState('AGENCY_OWNER');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [leads, setLeadsState] = useState(initialLeads);
  const [customers, setCustomersState] = useState(initialCustomers);
  const [visaCases, setVisaCasesState] = useState(initialVisaCases);
  const [quotations, setQuotationsState] = useState(initialQuotations);
  const [bookings, setBookingsState] = useState(initialBookings);
  const [payments, setPaymentsState] = useState(initialPayments);
  const [tasks, setTasksState] = useState(initialTasks);
  const [travelCases, setTravelCasesState] = useState([]);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppParams, setWhatsAppParams] = useState({ customer: '', phone: '', data: null });

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  useEffect(() => {
    if (currentRole === 'SUPER_ADMIN') {
      setActiveTab('superadmin');
    } else if (currentRole === 'SUB_AGENT') {
      setActiveTab('subagent');
    } else if (currentRole === 'CUSTOMER') {
      setActiveTab('portal');
    } else if (currentRole === 'VISA_OFFICER') {
      setActiveTab('visa');
    } else if (currentRole === 'ACCOUNTANT') {
      setActiveTab('finance');
    } else if (currentRole === 'OPERATIONS_STAFF') {
      setActiveTab('bookings');
    } else if (currentRole === 'TRAVEL_CONSULTANT') {
      setActiveTab('cases');
    } else if (currentRole === 'BRANCH_MANAGER') {
      setActiveTab('dashboard');
    }
  }, [currentRole]);

  // A tab is only reachable when the role AND the subscription plan allow it.
  useEffect(() => {
    if (!isAuthenticated) return;
    const allowed = allowedTabsFor(currentRole, planModules, selectedPlan);
    if (!allowed.length) return;
    if (!allowed.includes(activeTab)) setActiveTab(allowed[0]);
  }, [isAuthenticated, currentRole, planModules, selectedPlan, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsWhatsAppModalOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [leadsRes, customersRes, visaCasesRes, quotationsRes, bookingsRes, paymentsRes, tasksRes, travelCasesRes] = await Promise.all([
        api.collections.leads(),
        api.collections.customers(),
        api.collections.visaCases(),
        api.collections.quotations(),
        api.collections.bookings(),
        api.collections.payments(),
        api.collections.tasks(),
        api.collections.travelCases()
      ]);
      
      setLeadsState(leadsRes.data || []);
      setCustomersState(customersRes.data || []);
      setVisaCasesState(visaCasesRes.data || []);
      setQuotationsState(quotationsRes.data || []);
      setBookingsState(bookingsRes.data || []);
      setPaymentsState(paymentsRes.data || []);
      setTasksState(tasksRes.data || []);
      setTravelCasesState(travelCasesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Sign-in is only half the story — the session is hydrated from the API. */
  const hydrateSession = useCallback(async () => {
    try {
      const me = await api.me();
      setSession(me);
      setCurrentRole(me.user?.role || 'AGENCY_OWNER');
      setSelectedPlan(me.organization?.plan || null);
      return { ok: true };
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        setToken(null);
        setSession(null);
        setSessionNotice(error.message || 'Your workspace is not approved yet.');
        return { ok: false };
      }
      return { ok: true, degraded: true };
    }
  }, []);

  const loadEntitlements = useCallback(async () => {
    try {
      const data = await api.entitlements.get();
      setPlanModules(Array.isArray(data?.modules) && data.modules.length ? data.modules : null);
      if (data?.plan?.id) setSelectedPlan(data.plan.id);
    } catch {
      setPlanModules(null);
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    try {
      const res = await api.collections.customers();
      setCustomersState(res.data || []);
    } catch (error) {
      console.error('Failed to refresh customers:', error);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    hydrateSession().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setIsLoading(false);
        return;
      }
      setIsAuthenticated(true);
      Promise.all([loadAllData(), loadEntitlements()]).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [hydrateSession, loadAllData, loadEntitlements]);

  const setLeads = useCallback((updater) => {
    const newLeads = typeof updater === 'function' ? updater(leads) : updater;
    setLeadsState(newLeads);
    api.collections
      .replace('leads', newLeads)
      .then(() => {
        // The API converts won leads into customer records — re-read them.
        if (newLeads.some((lead) => lead && lead.stage === 'CONFIRMED')) return refreshCustomers();
        return undefined;
      })
      .catch(console.error);
  }, [leads, refreshCustomers]);

  const setCustomers = useCallback((updater) => {
    const newCustomers = typeof updater === 'function' ? updater(customers) : updater;
    setCustomersState(newCustomers);
    api.collections.replace('customers', newCustomers).catch(console.error);
  }, [customers]);

  const setVisaCases = useCallback((updater) => {
    const newVisaCases = typeof updater === 'function' ? updater(visaCases) : updater;
    setVisaCasesState(newVisaCases);
    api.collections.replace('visaCases', newVisaCases).catch(console.error);
  }, [visaCases]);

  const setQuotations = useCallback((updater) => {
    const newQuotations = typeof updater === 'function' ? updater(quotations) : updater;
    setQuotationsState(newQuotations);
    api.collections.replace('quotations', newQuotations).catch(console.error);
  }, [quotations]);

  const setBookings = useCallback((updater) => {
    const newBookings = typeof updater === 'function' ? updater(bookings) : updater;
    setBookingsState(newBookings);
    api.collections.replace('bookings', newBookings).catch(console.error);
  }, [bookings]);

  const setPayments = useCallback((updater) => {
    const newPayments = typeof updater === 'function' ? updater(payments) : updater;
    setPaymentsState(newPayments);
    api.collections.replace('payments', newPayments).catch(console.error);
  }, [payments]);

  const setTasks = useCallback((updater) => {
    const newTasks = typeof updater === 'function' ? updater(tasks) : updater;
    setTasksState(newTasks);
    api.collections.replace('tasks', newTasks).catch(console.error);
  }, [tasks]);

  const setTravelCases = useCallback((updater) => {
    const newTravelCases = typeof updater === 'function' ? updater(travelCases) : updater;
    setTravelCasesState(newTravelCases);
    api.collections.replace('travelCases', newTravelCases).catch(console.error);
  }, [travelCases]);

  /** Called by PublicSite once POST /auth/login returned a token. */
  const handleAuthenticated = useCallback(async (authSession) => {
    setSessionNotice('');
    if (authSession?.user?.role) setCurrentRole(authSession.user.role);
    if (authSession?.organization?.plan) setSelectedPlan(authSession.organization.plan);
    setSession(authSession || null);
    setIsAuthenticated(true);
    await Promise.all([loadAllData(), loadEntitlements()]);
  }, [loadAllData, loadEntitlements]);

  const signOut = useCallback(() => {
    setToken(null);
    setSession(null);
    setSessionNotice('');
    setPlanModules(null);
    setSelectedPlan(null);
    setCurrentRole('AGENCY_OWNER');
    setActiveTab('dashboard');
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const counts = {
    leads: leads.length,
    visaCases: visaCases.length,
    bookings: bookings.length,
    tasks: tasks.filter(t => t.status === 'PENDING').length,
    warnings: customers.reduce((acc, c) => {
      const expiring = c.travellers?.some(t => t.daysUntilPassportExpiry <= 180);
      return acc + (expiring ? 1 : 0);
    }, 0),
    overdue: bookings.filter(b => b.balanceAmountPKR > 0 && b.paymentStatus === 'PARTIALLY_PAID').length
  };

  const handleQuickAction = (actionType) => {
    if (actionType === 'NEW_LEAD') setActiveTab('leads');
    else if (actionType === 'NEW_VISA') setActiveTab('visa');
    else if (actionType === 'WHATSAPP') setIsWhatsAppModalOpen(true);
  };

  const triggerWhatsApp = (customer = '', phone = '', data = null) => {
    setWhatsAppParams({ customer, phone, data });
    setIsWhatsAppModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-mint border-t-transparent mx-auto mb-4" />
          <p style={{ color: 'var(--text-2)', fontFamily: 'var(--fb)' }}>Loading SafarDesk...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PublicSite onAuthenticated={handleAuthenticated} notice={sessionNotice} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--navy)', color: 'var(--text)' }}>
      <Navbar
        currentBranch={currentBranch}
        setCurrentBranch={setCurrentBranch}
        branches={initialAgencyData.branches}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
        onSignOut={signOut}
        sessionUser={session?.user || null}
        planId={selectedPlan}
      />

      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
          counts={counts}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentRole={currentRole}
          planModules={planModules}
          planId={selectedPlan}
        />

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 md:hidden"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--navy)' }}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {activeTab === 'superadmin' && <SuperAdminView />}
            {activeTab === 'cases' && (
              <TravelCasesView 
                travelCases={travelCases}
                setTravelCases={setTravelCases}
                currentRole={currentRole} 
                currentBranch={currentBranch} 
                onOpenWhatsApp={triggerWhatsApp} 
              />
            )}
            {activeTab === 'subagent' && <SubAgentView />}
            {activeTab === 'dashboard' && (
              <DashboardView
                currentBranch={currentBranch}
                leads={leads}
                customers={customers}
                visaCases={visaCases}
                bookings={bookings}
                payments={payments}
                onNavigate={setActiveTab}
                onOpenQuickAction={handleQuickAction}
              />
            )}
            {activeTab === 'portal' && <CustomerPortalView />}
            {activeTab === 'leads' && (
              <LeadsView leads={leads} setLeads={setLeads} customers={customers} onNavigate={setActiveTab} />
            )}
            {activeTab === 'tasks' && (
              <TasksView tasks={tasks} setTasks={setTasks} onOpenWhatsApp={triggerWhatsApp} />
            )}
            {activeTab === 'customers' && (
              <CustomersView customers={customers} setCustomers={setCustomers} onNavigate={setActiveTab} />
            )}
            {activeTab === 'visa' && (
              <VisaCasesView visaCases={visaCases} setVisaCases={setVisaCases} customers={customers} onNavigate={setActiveTab} />
            )}
            {activeTab === 'vault' && <DocumentVaultView />}
            {activeTab === 'quotations' && (
              <QuotationsView quotations={quotations} setQuotations={setQuotations} />
            )}
            {activeTab === 'packages' && (
              <PackagesView onOpenWhatsApp={triggerWhatsApp} />
            )}
            {activeTab === 'bookings' && (
              <BookingsView bookings={bookings} setBookings={setBookings} />
            )}
            {activeTab === 'finance' && (
              <FinanceView payments={payments} setPayments={setPayments} bookings={bookings} />
            )}
            {activeTab === 'suppliers' && <SuppliersView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      <button
        onClick={() => triggerWhatsApp('Chaudhry Kamran Akram', '+923004455667', { destination: 'Dubai, UAE' })}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-black font-bold shadow-xl shadow-[#25D366]/30 hover:scale-105 active:scale-95 transition-all text-xs"
        title="Open WhatsApp Communication Hub"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
        <span>WhatsApp Hub</span>
      </button>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        leads={leads}
        customers={customers}
        visaCases={visaCases}
        bookings={bookings}
        onNavigate={setActiveTab}
      />

      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        defaultCustomer={whatsAppParams.customer}
        defaultPhone={whatsAppParams.phone}
        defaultData={whatsAppParams.data}
      />
    </div>
  );
}