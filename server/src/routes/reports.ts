import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requirePermission, tenantWhere } from '../auth.js';
import { hasPermission } from '../rbac.js';

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requirePermission('workspace.read'));

reportsRouter.get('/dashboard', async (req, res) => {
  const orgId = req.user!.organizationId;
  
  const [
    leadsCount,
    customersCount,
    visaCasesCount,
    bookingsCount,
    paymentsCount,
    tasksCount,
    documentsCount
  ] = await Promise.all([
    prisma.tenantRecord.count({ where: { organizationId: orgId, collection: 'leads' } }),
    prisma.tenantRecord.count({ where: { organizationId: orgId, collection: 'customers' } }),
    prisma.tenantRecord.count({ where: { organizationId: orgId, collection: 'visaCases' } }),
    prisma.tenantRecord.count({ where: { organizationId: orgId, collection: 'bookings' } }),
    prisma.tenantRecord.count({ where: { organizationId: orgId, collection: 'payments' } }),
    prisma.tenantRecord.count({ where: { organizationId: orgId, collection: 'tasks' } }),
    prisma.document.count({ where: { organizationId: orgId } })
  ]);
  
  const [leads, visaCases, bookings, payments, customers] = await Promise.all([
    prisma.tenantRecord.findMany({ where: { organizationId: orgId, collection: 'leads' }, select: { payload: true } }),
    prisma.tenantRecord.findMany({ where: { organizationId: orgId, collection: 'visaCases' }, select: { payload: true } }),
    prisma.tenantRecord.findMany({ where: { organizationId: orgId, collection: 'bookings' }, select: { payload: true } }),
    prisma.tenantRecord.findMany({ where: { organizationId: orgId, collection: 'payments' }, select: { payload: true } }),
    prisma.tenantRecord.findMany({ where: { organizationId: orgId, collection: 'customers' }, select: { payload: true } })
  ]);
  
  const totalLeads = leads.length;
  const activeVisaCases = visaCases.filter(v => {
    const status = JSON.parse(v.payload).status;
    return status !== 'APPROVED' && status !== 'REJECTED' && status !== 'COMPLETED' && status !== 'CANCELLED';
  }).length;
  
  const pendingDocsCount = visaCases.reduce((acc, v) => {
    const checklists = JSON.parse(v.payload).checklists || [];
    return acc + checklists.filter((c: any) => c.status === 'PENDING' || c.status === 'UPLOADED').length;
  }, 0);
  
  const confirmedBookings = bookings.filter(b => JSON.parse(b.payload).status === 'CONFIRMED').length;
  
  const totalReceivablesPKR = bookings.reduce((acc, b) => acc + (JSON.parse(b.payload).balanceAmountPKR || 0), 0);
  const totalGrossMarginPKR = bookings.reduce((acc, b) => acc + Math.round((JSON.parse(b.payload).totalAmountPKR || 0) * 0.14), 0);
  const totalRevenuePKR = bookings.reduce((acc, b) => acc + (JSON.parse(b.payload).totalAmountPKR || 0), 0);
  
  const overduePayments = payments.filter(p => JSON.parse(p.payload).status === 'OVERDUE').length;
  const pendingPayments = payments.filter(p => JSON.parse(p.payload).status === 'PENDING').length;
  
  const activeDepartures = bookings
    .filter(b => {
      const payload = JSON.parse(b.payload);
      return payload.status === 'CONFIRMED' && payload.flightDetails?.departureTime;
    })
    .slice(0, 5)
    .map(b => {
      const p = JSON.parse(b.payload);
      return {
        id: p.bookingCode || p.id,
        customer: p.customerName,
        pax: p.travellerCount || 1,
        destination: p.destination,
        date: p.travelDates?.split('–')[0]?.trim() || '',
        pnr: p.flightDetails?.pnr || '',
        flightStatus: p.flightDetails?.status || 'Confirmed',
        visaStatus: 'In Progress',
        statusColor: 'cyan'
      };
    });
  
  res.json({
    kpis: {
      totalLeads,
      activeVisaCases,
      pendingDocsCount,
      confirmedBookings,
      totalReceivablesPKR,
      totalGrossMarginPKR,
      totalRevenuePKR,
      overduePayments,
      pendingPayments,
      totalCustomers: customersCount,
      activeCustomers: customers.length
    },
    activeDepartures,
    counts: {
      leads: leadsCount,
      visaCases: visaCasesCount,
      bookings: bookingsCount,
      payments: paymentsCount,
      tasks: tasksCount,
      documents: documentsCount
    }
  });
});

reportsRouter.get('/lead-source', async (req, res) => {
  const orgId = req.user!.organizationId;
  const leads = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'leads' },
    select: { payload: true }
  });
  
  const bySource = leads.reduce((acc, l) => {
    const source = JSON.parse(l.payload).source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byStage = leads.reduce((acc, l) => {
    const stage = JSON.parse(l.payload).stage || 'NEW';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byConsultant = leads.reduce((acc, l) => {
    const consultant = JSON.parse(l.payload).assignedTo || 'Unassigned';
    acc[consultant] = (acc[consultant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  res.json({ bySource, byStage, byConsultant });
});

reportsRouter.get('/conversion', async (req, res) => {
  const orgId = req.user!.organizationId;
  const leads = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'leads' },
    select: { payload: true }
  });
  
  const bookings = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'bookings' },
    select: { payload: true }
  });
  
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => JSON.parse(l.payload).stage === 'CONFIRMED').length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads * 100).toFixed(1) : '0';
  
  const totalBookings = bookings.length;
  const totalBookingValue = bookings.reduce((sum, b) => sum + (JSON.parse(b.payload).totalAmountPKR || 0), 0);
  
  res.json({
    totalLeads,
    wonLeads,
    conversionRate: `${conversionRate}%`,
    totalBookings,
    totalBookingValue,
    avgBookingValue: totalBookings > 0 ? Math.round(totalBookingValue / totalBookings) : 0
  });
});

reportsRouter.get('/consultant-performance', async (req, res) => {
  const orgId = req.user!.organizationId;
  const leads = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'leads' },
    select: { payload: true }
  });
  
  const bookings = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'bookings' },
    select: { payload: true }
  });
  
  const consultants = [...new Set(leads.map(l => JSON.parse(l.payload).assignedTo).filter(Boolean))];
  
  const performance = consultants.map(consultant => {
    const consultantLeads = leads.filter(l => JSON.parse(l.payload).assignedTo === consultant);
    const consultantBookings = bookings.filter(b => JSON.parse(b.payload).assignedConsultant === consultant || 
      consultantLeads.some(l => JSON.parse(l.payload).id === JSON.parse(b.payload).customerId));
    
    return {
      consultant,
      totalLeads: consultantLeads.length,
      wonLeads: consultantLeads.filter(l => JSON.parse(l.payload).stage === 'CONFIRMED').length,
      totalBookings: consultantBookings.length,
      totalRevenue: consultantBookings.reduce((sum, b) => sum + (JSON.parse(b.payload).totalAmountPKR || 0), 0)
    };
  });
  
  res.json({ performance });
});

reportsRouter.get('/visa-status', async (req, res) => {
  const orgId = req.user!.organizationId;
  const visaCases = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'visaCases' },
    select: { payload: true }
  });
  
  const byStatus = visaCases.reduce((acc, v) => {
    const status = JSON.parse(v.payload).status || 'NEW';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byDestination = visaCases.reduce((acc, v) => {
    const dest = JSON.parse(v.payload).destination || 'Unknown';
    acc[dest] = (acc[dest] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byOfficer = visaCases.reduce((acc, v) => {
    const officer = JSON.parse(v.payload).assignedOfficer || 'Unassigned';
    acc[officer] = (acc[officer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const pendingDocs = visaCases.reduce((sum, v) => {
    const checklists = JSON.parse(v.payload).checklists || [];
    return sum + checklists.filter((c: any) => c.status === 'PENDING' || c.status === 'UPLOADED').length;
  }, 0);
  
  res.json({ byStatus, byDestination, byOfficer, pendingDocs });
});

reportsRouter.get('/booking-revenue', async (req, res) => {
  const orgId = req.user!.organizationId;
  const bookings = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'bookings' },
    select: { payload: true }
  });
  
  const byMonth = bookings.reduce((acc, b) => {
    const payload = JSON.parse(b.payload);
    const date = payload.createdDate || payload.travelDates?.split('–')[0]?.trim();
    if (date) {
      const month = date.slice(0, 7);
      acc[month] = (acc[month] || 0) + (payload.totalAmountPKR || 0);
    }
    return acc;
  }, {} as Record<string, number>);
  
  const byType = bookings.reduce((acc, b) => {
    const type = JSON.parse(b.payload).type || 'Package';
    acc[type] = (acc[type] || 0) + (JSON.parse(b.payload).totalAmountPKR || 0);
    return acc;
  }, {} as Record<string, number>);
  
  const totalRevenue = bookings.reduce((sum, b) => sum + (JSON.parse(b.payload).totalAmountPKR || 0), 0);
  const totalPaid = bookings.reduce((sum, b) => sum + (JSON.parse(b.payload).paidAmountPKR || 0), 0);
  const totalOutstanding = bookings.reduce((sum, b) => sum + (JSON.parse(b.payload).balanceAmountPKR || 0), 0);
  
  res.json({ byMonth, byType, totalRevenue, totalPaid, totalOutstanding });
});

reportsRouter.get('/outstanding-balances', async (req, res) => {
  const orgId = req.user!.organizationId;
  const customers = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'customers' },
    select: { payload: true }
  });
  
  const bookings = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'bookings' },
    select: { payload: true }
  });
  
  const customerBalances = customers
    .map(c => {
      const p = JSON.parse(c.payload);
      return {
        customerId: p.id,
        customerName: p.name,
        phone: p.phone,
        outstandingBalancePKR: p.outstandingBalancePKR || 0,
        totalBookings: p.totalBookings || 0
      };
    })
    .filter(c => c.outstandingBalancePKR > 0)
    .sort((a, b) => b.outstandingBalancePKR - a.outstandingBalancePKR);
  
  const bookingBalances = bookings
    .map(b => {
      const p = JSON.parse(b.payload);
      return {
        bookingId: p.id,
        bookingCode: p.bookingCode,
        customerName: p.customerName,
        totalAmountPKR: p.totalAmountPKR || 0,
        paidAmountPKR: p.paidAmountPKR || 0,
        balanceAmountPKR: p.balanceAmountPKR || 0,
        status: p.paymentStatus
      };
    })
    .filter(b => b.balanceAmountPKR > 0)
    .sort((a, b) => b.balanceAmountPKR - a.balanceAmountPKR);
  
  const totalOutstanding = customerBalances.reduce((sum, c) => sum + c.outstandingBalancePKR, 0);
  
  res.json({ customerBalances, bookingBalances, totalOutstanding });
});

reportsRouter.get('/supplier-payable', async (req, res) => {
  const orgId = req.user!.organizationId;
  const suppliers = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'suppliers' },
    select: { payload: true }
  });
  
  const ledger = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'supplierLedger' },
    select: { payload: true }
  });
  
  const supplierPayables = suppliers.map(s => {
    const p = JSON.parse(s.payload);
    const supplierLedger = ledger.filter(l => JSON.parse(l.payload).supplierId === p.id);
    const totalDebit = supplierLedger.reduce((sum, l) => sum + (JSON.parse(l.payload).debit || 0), 0);
    const totalCredit = supplierLedger.reduce((sum, l) => sum + (JSON.parse(l.payload).credit || 0), 0);
    const currentBalance = totalDebit - totalCredit;
    
    return {
      supplierId: p.id,
      supplierName: p.name,
      type: p.type,
      creditLimitPKR: p.creditLimitPKR || 0,
      payableBalancePKR: currentBalance,
      currency: p.currency || 'PKR'
    };
  }).filter(s => s.payableBalancePKR > 0);
  
  const totalPayable = supplierPayables.reduce((sum, s) => sum + s.payableBalancePKR, 0);
  
  res.json({ supplierPayables, totalPayable });
});

reportsRouter.get('/expenses', async (req, res) => {
  const orgId = req.user!.organizationId;
  const expenses = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'expenses' },
    select: { payload: true }
  });
  
  const byCategory = expenses.reduce((acc, e) => {
    const cat = JSON.parse(e.payload).category || 'Other';
    const amount = JSON.parse(e.payload).amountPKR || 0;
    acc[cat] = (acc[cat] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
  
  const byMonth = expenses.reduce((acc, e) => {
    const date = JSON.parse(e.payload).date;
    if (date) {
      const month = date.slice(0, 7);
      const amount = JSON.parse(e.payload).amountPKR || 0;
      acc[month] = (acc[month] || 0) + amount;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const total = expenses.reduce((sum, e) => sum + (JSON.parse(e.payload).amountPKR || 0), 0);
  
  res.json({ byCategory, byMonth, total });
});

reportsRouter.get('/branch-performance', async (req, res) => {
  const orgId = req.user!.organizationId;
  const branches = await prisma.branch.findMany({ where: { organizationId: orgId } });
  const leads = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'leads' },
    select: { payload: true }
  });
  const bookings = await prisma.tenantRecord.findMany({
    where: { organizationId: orgId, collection: 'bookings' },
    select: { payload: true }
  });
  
  const performance = branches.map(branch => {
    const branchLeads = leads.filter(l => JSON.parse(l.payload).branchId === branch.id);
    const branchBookings = bookings.filter(b => JSON.parse(b.payload).branchId === branch.id);
    
    return {
      branchId: branch.id,
      branchName: branch.name,
      totalLeads: branchLeads.length,
      wonLeads: branchLeads.filter(l => JSON.parse(l.payload).stage === 'CONFIRMED').length,
      totalBookings: branchBookings.length,
      totalRevenue: branchBookings.reduce((sum, b) => sum + (JSON.parse(b.payload).totalAmountPKR || 0), 0)
    };
  });
  
  res.json({ performance });
});