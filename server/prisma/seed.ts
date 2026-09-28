import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/env.js';
import {
  initialAgencyData,
  initialUsers,
  initialLeads,
  initialCustomers,
  initialVisaCases,
  initialQuotations,
  initialBookings,
  initialPayments,
  initialSuppliers,
  initialSupplierLedger,
  initialPackages,
  initialCommissions,
  initialTasks,
  initialAuditLogs,
  initialOrganizations,
  initialTravelCases,
  initialSubAgentCases,
  initialWhatsAppTemplates
} from '../../src/data/mockData.js';
import { searchTextFrom } from '../src/store.js';

const prisma = new PrismaClient();

function asRecords(items: unknown[]) {
  return items.map((item) => {
    const record = JSON.parse(JSON.stringify(item)) as Record<string, unknown>;
    if (Array.isArray(record.checklists)) {
      const checklists = record.checklists as Array<{ status: string }>;
      const verified = checklists.filter((c) => c.status === 'VERIFIED' || c.status === 'UPLOADED').length;
      record.completionPercentage = checklists.length ? Math.round((verified / checklists.length) * 100) : 0;
    }
    return record;
  });
}

async function seedCollection(organizationId: string, collection: string, items: unknown[]) {
  const records = asRecords(items);
  for (const item of records) {
    const id = String(item.id);
    await prisma.tenantRecord.upsert({
      where: { organizationId_collection_id: { organizationId, collection, id } },
      create: {
        organizationId,
        collection,
        id,
        payload: JSON.stringify(item),
        searchText: searchTextFrom(item)
      },
      update: {
        payload: JSON.stringify(item),
        searchText: searchTextFrom(item)
      }
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(env.demoPassword, 10);
  const demoOrgId = 'org-1';

  for (const org of initialOrganizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        ownerName: org.ownerName,
        email: org.email,
        phone: org.phone,
        headquarters: org.headquarters,
        plan: org.plan,
        status: org.status,
        branchesCount: org.branchesCount,
        usersCount: org.usersCount,
        activeCasesCount: org.activeCasesCount,
        mrrPKR: org.mrrPKR,
        renewalDate: org.renewalDate,
        storageUsedMB: org.storageUsedMB,
        dtsLicense: org.dtsLicense,
        createdDate: org.createdDate,
        tagline: org.id === demoOrgId ? initialAgencyData.tagline : null,
        licenseNumber: org.id === demoOrgId ? initialAgencyData.licenseNumber : null,
        whatsapp: org.id === demoOrgId ? initialAgencyData.whatsapp : null,
        defaultCurrency: initialAgencyData.defaultCurrency,
        defaultTimezone: initialAgencyData.defaultTimezone,
        currenciesJson: JSON.stringify(initialAgencyData.currencies)
      },
      update: {
        name: org.name,
        status: org.status,
        plan: org.plan
      }
    });
  }

  for (const branch of initialAgencyData.branches) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      create: {
        id: branch.id,
        organizationId: demoOrgId,
        name: branch.name,
        manager: branch.manager,
        phone: branch.phone,
        activeLeads: branch.activeLeads,
        totalStaff: branch.totalStaff
      },
      update: {
        name: branch.name,
        manager: branch.manager,
        phone: branch.phone,
        activeLeads: branch.activeLeads,
        totalStaff: branch.totalStaff
      }
    });
  }

  await prisma.user.upsert({
    where: { id: 'u-super' },
    create: {
      id: 'u-super',
      organizationId: demoOrgId,
      branchId: 'b-lhr',
      name: 'SafarDesk Platform Admin',
      email: 'nina.v@example.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      phone: '+92 300 0000000',
      avatar: 'SA'
    },
    update: { passwordHash, role: 'SUPER_ADMIN' }
  });

  for (const user of initialUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        organizationId: demoOrgId,
        branchId: user.branchId,
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      },
      update: {
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash,
        role: user.role,
        branchId: user.branchId,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  }

  const collections: Array<[string, unknown[]]> = [
    ['leads', initialLeads],
    ['customers', initialCustomers],
    ['visaCases', initialVisaCases],
    ['quotations', initialQuotations],
    ['bookings', initialBookings],
    ['payments', initialPayments],
    ['suppliers', initialSuppliers],
    ['supplierLedger', initialSupplierLedger],
    ['packages', initialPackages],
    ['commissions', initialCommissions],
    ['tasks', initialTasks],
    ['travelCases', initialTravelCases],
    ['subAgentCases', initialSubAgentCases],
    ['whatsappTemplates', initialWhatsAppTemplates]
  ];

  for (const [collection, items] of collections) {
    await seedCollection(demoOrgId, collection, items);
  }

  for (const log of initialAuditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      create: {
        id: log.id,
        organizationId: demoOrgId,
        timestamp: log.timestamp,
        actor: log.actor,
        role: log.role,
        action: log.action,
        target: log.target,
        details: log.details,
        branch: log.branch,
        ip: log.ip
      },
      update: { details: log.details }
    });
  }

  const starterRoles = ['AGENCY_OWNER', 'TRAVEL_CONSULTANT', 'OPERATIONS_STAFF', 'CUSTOMER'];
  const businessRoles = [...starterRoles, 'AGENCY_MANAGER', 'VISA_OFFICER', 'ACCOUNTANT'];
  const proRoles = [
    'AGENCY_OWNER',
    'AGENCY_MANAGER',
    'TRAVEL_CONSULTANT',
    'VISA_OFFICER',
    'ACCOUNTANT',
    'OPERATIONS_STAFF',
    'BRANCH_MANAGER',
    'SUB_AGENT',
    'CUSTOMER'
  ];
  const planCatalogSeed = [
    {
      id: 'STARTER',
      name: 'Agency Starter',
      price: 18000,
      roles: 4,
      branches: 1,
      features: 'Leads, quotations, bookings',
      description: 'For single-office agencies getting digital.',
      storageGB: 1,
      allowedRoles: starterRoles,
      sortOrder: 1
    },
    {
      id: 'BUSINESS',
      name: 'Business Growth',
      price: 42000,
      roles: 10,
      branches: 3,
      features: 'WhatsApp, visa, finance, reports',
      description: 'For growing agencies with multiple teams.',
      storageGB: 5,
      allowedRoles: businessRoles,
      sortOrder: 2
    },
    {
      id: 'AGENCY_PRO',
      name: 'Agency Enterprise Pro',
      price: 85000,
      roles: 25,
      branches: 10,
      features: 'All modules, API, audit exports',
      description: 'Full platform for multi-branch enterprises.',
      storageGB: 20,
      allowedRoles: proRoles,
      sortOrder: 3
    }
  ];
  for (const plan of planCatalogSeed) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      create: { ...plan, allowedRoles: JSON.stringify(plan.allowedRoles) },
      update: {
        price: plan.price,
        roles: plan.roles,
        branches: plan.branches,
        features: plan.features,
        description: plan.description,
        storageGB: plan.storageGB,
        allowedRoles: JSON.stringify(plan.allowedRoles),
        sortOrder: plan.sortOrder
      }
    });
  }

  const secondOrg = await prisma.organization.findUnique({ where: { id: 'org-2' } });
  if (secondOrg) {
    await prisma.user.upsert({
      where: { id: 'u-org2' },
      create: {
        id: 'u-org2',
        organizationId: 'org-2',
        name: 'Junaid Abbasi',
        email: 'junaid@karakoramexpress.pk',
        passwordHash,
        role: 'AGENCY_OWNER',
        avatar: 'JA'
      },
      update: { passwordHash }
    });
    await prisma.tenantRecord.upsert({
      where: { organizationId_collection_id: { organizationId: 'org-2', collection: 'leads', id: 'LEAD-SECRET' } },
      create: {
        organizationId: 'org-2',
        collection: 'leads',
        id: 'LEAD-SECRET',
        payload: JSON.stringify({ id: 'LEAD-SECRET', name: 'Tenant B Private Lead', phone: '+92000000000' }),
        searchText: 'lead-secret tenant b private lead'
      },
      update: {}
    });
  }

  console.log('SafarDesk demo workspace seeded.');
  console.log(`Demo login:  / ${env.demoPassword}`);
  console.log(`Owner login:  / ${env.demoPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
