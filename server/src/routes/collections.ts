import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requirePermission, tenantWhere } from '../auth.js';
import { hasPermission, collectionPermission, isWriteCollection, WRITE_COLLECTIONS, type CollectionName } from '../rbac.js';
import { listCollection, replaceCollection, upsertRecord, deleteRecord, searchTextFrom } from '../store.js';
import { writeAudit } from '../audit.js';
import { schemas, type CollectionName as SchemaCollectionName } from '../schemas.js';

export const collectionsRouter = Router();

collectionsRouter.use(requireAuth);

// Global search - must come before :collection routes
collectionsRouter.get('/search', requirePermission('workspace.read'), async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) {
    res.json({ results: [] });
    return;
  }
  
  const limit = Math.min(Number(req.query.limit) || 25, 50);
  const collections = (req.query.collections as string)?.split(',') || WRITE_COLLECTIONS;
  
  const results: Array<{ collection: string; id: string; record: Record<string, unknown> }> = [];
  
  for (const collection of collections) {
    if (!isWriteCollection(collection)) continue;
    
    const rows = await prisma.tenantRecord.findMany({
      where: {
        ...tenantWhere(req),
        collection,
        searchText: { contains: q }
      },
      take: Math.ceil(limit / collections.length)
    });
    
    for (const row of rows) {
      results.push({
        collection,
        id: row.id,
        record: JSON.parse(row.payload)
      });
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }
  
  res.json({ results });
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  branchId: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

function buildWhereClause(req: any, collection: CollectionName) {
  const where: any = { ...tenantWhere(req), collection };
  
  if (req.query.search) {
    where.searchText = { contains: req.query.search.toLowerCase() };
  }
  
  if (req.query.branchId) {
    where.payload = { path: ['branchId'], equals: req.query.branchId };
  }
  
  if (req.query.assignedTo) {
    where.payload = { path: ['assignedTo'], equals: req.query.assignedTo };
  }
  
  if (req.query.status) {
    where.payload = { path: ['status'], equals: req.query.status };
  }
  
  if (req.query.priority) {
    where.payload = { path: ['priority'], equals: req.query.priority };
  }
  
  if (req.query.dateFrom || req.query.dateTo) {
    where.createdAt = {};
    if (req.query.dateFrom) where.createdAt.gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) where.createdAt.lte = new Date(req.query.dateTo);
  }
  
  return where;
}

function getSortOrder(req: any) {
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder || 'desc';
  return { [sortBy]: sortOrder };
}

async function validateAndParse(collection: CollectionName, data: unknown) {
  const schema = schemas[collection as SchemaCollectionName];
  if (!schema) return { success: true, data };
  
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  return { success: true, data: result.data };
}

async function checkCollectionPermission(req: any, collection: string, permission: 'read' | 'write') {
  if (!isWriteCollection(collection)) {
    return { allowed: false, error: 'Unknown collection' };
  }
  
  const perm = permission === 'read' ? 'workspace.read' : collectionPermission(collection);
  if (!req.user || !hasPermission(req.user.role, perm)) {
    return { allowed: false, error: 'You do not have permission for this action' };
  }
  return { allowed: true };
}

/** Leads reach this stage when the deal is confirmed / won (README §8 · Leads CRM). */
const WON_LEAD_STAGE = 'CONFIRMED';

function customerFromLead(lead: Record<string, unknown>) {
  const leadId = String(lead.id);
  const travellerCount = Number(lead.travellerCount || 1);
  return {
    id: `CUST-${leadId}`,
    name: String(lead.name || ''),
    phone: String(lead.phone || ''),
    whatsapp: String(lead.whatsapp || lead.phone || ''),
    email: String(lead.email || ''),
    cnic: '',
    city: String(lead.city || ''),
    address: '',
    customerType: 'Won Lead',
    preferredDestinations: lead.destination ? [String(lead.destination)] : [],
    notes: `Converted from won lead ${leadId}${lead.notes ? ` — ${lead.notes}` : ''}`,
    source: String(lead.source || 'Lead conversion'),
    assignedConsultant: String(lead.assignedTo || ''),
    branchId: String(lead.branchId || ''),
    totalBookings: 0,
    lifetimeSpendPKR: 0,
    outstandingBalancePKR: 0,
    travellerCount,
    activeVisaCases: 0,
    leadId,
    wonAt: new Date().toISOString().slice(0, 10),
    travellers: []
  };
}

/**
 * Won-lead → customer conversion (README §8 · Leads CRM).
 * Idempotent: the customer id is derived from the lead id, so replays and
 * repeated stage saves never duplicate a record.
 */
async function convertWonLeads(req: any, leads: Array<Record<string, unknown>>) {
  const created: string[] = [];
  const existingIds: string[] = [];
  for (const lead of leads) {
    if (!lead || lead.stage !== WON_LEAD_STAGE || !lead.id) continue;
    const customerId = `CUST-${String(lead.id)}`;
    const current = await prisma.tenantRecord.findUnique({
      where: {
        organizationId_collection_id: {
          organizationId: req.user!.organizationId,
          collection: 'customers',
          id: customerId
        }
      }
    });
    if (current) {
      existingIds.push(customerId);
      if (lead.customerId !== customerId) {
        lead.customerId = customerId;
        await upsertRecord(req.user!.organizationId, 'leads', { ...lead, customerId });
      }
      continue;
    }

    const customer = customerFromLead(lead);
    lead.customerId = customerId;
    await upsertRecord(req.user!.organizationId, 'customers', customer);
    await upsertRecord(req.user!.organizationId, 'leads', { ...lead, customerId });
    await writeAudit({
      user: req.user!,
      action: 'RECORD_CREATED',
      target: customerId,
      details: `Auto-created customer from won lead ${lead.id} (${lead.name})`,
      ip: req.ip
    });
    created.push(customerId);
  }
  return { created, existingIds };
}

collectionsRouter.get('/:collection', async (req, res) => {
  const { collection } = req.params;
  const permCheck = await checkCollectionPermission(req, collection, 'read');
  if (!permCheck.allowed) {
    res.status(403).json({ error: permCheck.error });
    return;
  }
  
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    return;
  }
  
  const { page, limit, sortBy, sortOrder, ...filters } = parsed.data;
  const where = buildWhereClause({ ...req, query: filters }, collection as CollectionName);
  
  const [rows, total] = await Promise.all([
    prisma.tenantRecord.findMany({
      where,
      orderBy: getSortOrder(req),
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.tenantRecord.count({ where })
  ]);
  
  res.json({
    data: rows.map(row => JSON.parse(row.payload)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

collectionsRouter.get('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const permCheck = await checkCollectionPermission(req, collection, 'read');
  if (!permCheck.allowed) {
    res.status(403).json({ error: permCheck.error });
    return;
  }
  
  const record = await prisma.tenantRecord.findUnique({
    where: {
      organizationId_collection_id: {
        organizationId: req.user!.organizationId,
        collection,
        id
      }
    }
  });
  
  if (!record) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  
  res.json(JSON.parse(record.payload));
});

collectionsRouter.post('/:collection', async (req, res) => {
  const { collection } = req.params;
  const permCheck = await checkCollectionPermission(req, collection, 'write');
  if (!permCheck.allowed) {
    res.status(403).json({ error: permCheck.error });
    return;
  }
  
  const validation = await validateAndParse(collection as CollectionName, req.body);
  if (!validation.success) {
    res.status(400).json({ error: 'Validation failed', details: validation.errors });
    return;
  }
  
  const item = validation.data as Record<string, unknown>;
  if (!item.id) {
    item.id = `${collection.slice(0, 3).toUpperCase()}-${Date.now()}`;
  }
  
  await upsertRecord(req.user!.organizationId, collection as CollectionName, item);
  await writeAudit({
    user: req.user!,
    action: 'RECORD_CREATED',
    target: String(item.id),
    details: `Created ${collection} record ${item.id}`,
    ip: req.ip
  });

  const conversion =
    collection === 'leads' ? await convertWonLeads(req, [item as Record<string, unknown>]) : { created: [], existingIds: [] };

  res.status(201).json(collection === 'leads' ? { ...item, convertedCustomers: conversion.created } : item);
});

collectionsRouter.patch('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const permCheck = await checkCollectionPermission(req, collection, 'write');
  if (!permCheck.allowed) {
    res.status(403).json({ error: permCheck.error });
    return;
  }
  
  const existing = await prisma.tenantRecord.findUnique({
    where: {
      organizationId_collection_id: {
        organizationId: req.user!.organizationId,
        collection,
        id
      }
    }
  });
  
  if (!existing) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  
  const current = JSON.parse(existing.payload) as Record<string, unknown>;
  const merged = { ...current, ...req.body, id };
  
  const validation = await validateAndParse(collection as CollectionName, merged);
  if (!validation.success) {
    res.status(400).json({ error: 'Validation failed', details: validation.errors });
    return;
  }
  
  await upsertRecord(req.user!.organizationId, collection as CollectionName, validation.data as Record<string, unknown>);
  await writeAudit({
    user: req.user!,
    action: 'RECORD_UPDATED',
    target: id,
    details: `Updated ${collection} record ${id}`,
    ip: req.ip
  });

  if (collection === 'leads') {
    await convertWonLeads(req, [validation.data as Record<string, unknown>]);
  }

  res.json(validation.data);
});

collectionsRouter.put('/:collection', async (req, res) => {
  const { collection } = req.params;
  const permCheck = await checkCollectionPermission(req, collection, 'write');
  if (!permCheck.allowed) {
    res.status(403).json({ error: permCheck.error });
    return;
  }
  
  const items = Array.isArray(req.body?.items) ? req.body.items : Array.isArray(req.body) ? req.body : null;
  if (!items) {
    res.status(400).json({ error: 'Expected an items array' });
    return;
  }
  
  const validatedItems: Record<string, unknown>[] = [];
  for (const item of items) {
    const validation = await validateAndParse(collection as CollectionName, item);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.errors });
      return;
    }
    validatedItems.push(validation.data as Record<string, unknown>);
  }
  
  await replaceCollection(req.user!.organizationId, collection as CollectionName, validatedItems);
  await writeAudit({
    user: req.user!,
    action: 'COLLECTION_UPDATED',
    target: collection,
    details: `Replaced ${collection} with ${validatedItems.length} records`,
    ip: req.ip
  });

  const conversion =
    collection === 'leads' ? await convertWonLeads(req, validatedItems) : { created: [], existingIds: [] };

  res.json(
    collection === 'leads'
      ? { ok: true, count: validatedItems.length, convertedCustomers: conversion.created }
      : { ok: true, count: validatedItems.length }
  );
});

collectionsRouter.delete('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const permCheck = await checkCollectionPermission(req, collection, 'write');
  if (!permCheck.allowed) {
    res.status(403).json({ error: permCheck.error });
    return;
  }
  
  await deleteRecord(req.user!.organizationId, collection as CollectionName, id);
  await writeAudit({
    user: req.user!,
    action: 'RECORD_DELETED',
    target: id,
    details: `Deleted ${collection} record ${id}`,
    ip: req.ip
  });
  
  res.json({ ok: true });
});

collectionsRouter.get('/:collection/stats/summary', async (req, res) => {
  const { collection } = req.params;
  const permCheck = await checkCollectionPermission(req, collection, 'read');
  if (!permCheck.allowed) {
    res.status(403).json({ error: permCheck.error });
    return;
  }
  
  const where = buildWhereClause(req, collection as CollectionName);
  const rows = await prisma.tenantRecord.findMany({ where, select: { payload: true } });
  
  let stats: Record<string, any> = { total: rows.length };
  
  if (collection === 'leads') {
    const byStage = rows.reduce((acc, r) => {
      const stage = JSON.parse(r.payload).stage || 'NEW';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    stats.byStage = byStage;
    stats.byPriority = rows.reduce((acc, r) => {
      const p = JSON.parse(r.payload).priority || 'MEDIUM';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    stats.bySource = rows.reduce((acc, r) => {
      const s = JSON.parse(r.payload).source || 'Unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  if (collection === 'visaCases') {
    const byStatus = rows.reduce((acc, r) => {
      const s = JSON.parse(r.payload).status || 'NEW';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    stats.byStatus = byStatus;
    const pendingDocs = rows.reduce((sum, r) => {
      const checklists = (JSON.parse(r.payload).checklists || []) as Array<{ status: string }>;
      return sum + checklists.filter(c => c.status === 'PENDING' || c.status === 'UPLOADED').length;
    }, 0);
    stats.pendingDocuments = pendingDocs;
  }
  
  if (collection === 'bookings') {
    stats.confirmed = rows.filter(r => JSON.parse(r.payload).status === 'CONFIRMED').length;
    stats.totalRevenue = rows.reduce((sum, r) => sum + (JSON.parse(r.payload).totalAmountPKR || 0), 0);
    stats.totalReceivables = rows.reduce((sum, r) => sum + (JSON.parse(r.payload).balanceAmountPKR || 0), 0);
  }
  
  if (collection === 'payments') {
    stats.totalCollected = rows.reduce((sum, r) => sum + (JSON.parse(r.payload).amountPKR || 0), 0);
    stats.byMethod = rows.reduce((acc, r) => {
      const m = JSON.parse(r.payload).paymentMethod || 'Cash';
      acc[m] = (acc[m] || 0) + (JSON.parse(r.payload).amountPKR || 0);
      return acc;
    }, {} as Record<string, number>);
    stats.byStatus = rows.reduce((acc, r) => {
      const s = JSON.parse(r.payload).status || 'PENDING';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  if (collection === 'customers') {
    stats.totalOutstanding = rows.reduce((sum, r) => sum + (JSON.parse(r.payload).outstandingBalancePKR || 0), 0);
    stats.activeVisaCases = rows.reduce((sum, r) => sum + (JSON.parse(r.payload).activeVisaCases || 0), 0);
  }
  
  res.json(stats);
});