import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requirePermission, tenantWhere } from '../auth.js';
import { WRITE_COLLECTIONS, collectionPermission, hasPermission, isWriteCollection } from '../rbac.js';
import { deleteRecord, listCollection, replaceCollection, upsertRecord } from '../store.js';
import { writeAudit } from '../audit.js';
import { enforceTenantPolicy } from '../enforce.js';
import { serializeOrg } from './auth.js';

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);
workspaceRouter.use(enforceTenantPolicy);

workspaceRouter.get('/', requirePermission('workspace.read'), async (req, res) => {
  const orgId = req.user!.organizationId;
  const [organization, branches, users, auditLogs, documents] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.branch.findMany({ where: { organizationId: orgId } }),
    prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true, role: true, branchId: true, phone: true, avatar: true }
    }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    prisma.document.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } })
  ]);

  const collections: Record<string, unknown[]> = {};
  await Promise.all(
    WRITE_COLLECTIONS.map(async (collection) => {
      collections[collection] = await listCollection(orgId, collection);
    })
  );

  const platformOrgs =
    req.user!.role === 'SUPER_ADMIN'
      ? (await prisma.organization.findMany()).map(serializeOrg)
      : [];

  res.json({
    organization: organization
      ? {
          ...serializeOrg(organization),
          branches
        }
      : null,
    users,
    auditLogs,
    documents: documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      category: doc.category,
      customer: doc.customer,
      traveller: doc.traveller,
      size: `${(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB`,
      status: doc.status,
      uploadedBy: doc.uploadedBy,
      expiryDate: doc.expiryDate,
      notes: doc.notes,
      ...JSON.parse(doc.payload || '{}')
    })),
    platformOrganizations: platformOrgs,
    ...collections
  });
});

workspaceRouter.put('/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!isWriteCollection(collection)) {
    res.status(400).json({ error: 'Unknown collection' });
    return;
  }
  if (!req.user || !hasPermission(req.user.role, collectionPermission(collection))) {
    res.status(403).json({ error: 'You do not have permission for this action' });
    return;
  }
  const items = Array.isArray(req.body?.items) ? req.body.items : Array.isArray(req.body) ? req.body : null;
  if (!items) {
    res.status(400).json({ error: 'Expected an items array' });
    return;
  }
  await replaceCollection(req.user.organizationId, collection, items);
  await writeAudit({
    user: req.user,
    action: 'COLLECTION_UPDATED',
    target: collection,
    details: `Replaced ${collection} with ${items.length} records`,
    ip: req.ip
  });
  res.json({ ok: true, count: items.length, items });
});

workspaceRouter.post('/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!isWriteCollection(collection)) {
    res.status(400).json({ error: 'Unknown collection' });
    return;
  }
  if (!req.user || !hasPermission(req.user.role, collectionPermission(collection))) {
    res.status(403).json({ error: 'You do not have permission for this action' });
    return;
  }
  const item = req.body as Record<string, unknown>;
  if (!item?.id) {
    item.id = `${collection.slice(0, 3).toUpperCase()}-${Date.now()}`;
  }
  await upsertRecord(req.user.organizationId, collection, item);
  await writeAudit({
    user: req.user,
    action: 'RECORD_CREATED',
    target: String(item.id),
    details: `Created ${collection} record ${item.id}`,
    ip: req.ip
  });
  res.status(201).json(item);
});

workspaceRouter.patch('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!isWriteCollection(collection)) {
    res.status(400).json({ error: 'Unknown collection' });
    return;
  }
  if (!req.user || !hasPermission(req.user.role, collectionPermission(collection))) {
    res.status(403).json({ error: 'You do not have permission for this action' });
    return;
  }
  const existing = await prisma.tenantRecord.findUnique({
    where: {
      organizationId_collection_id: {
        organizationId: req.user.organizationId,
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
  const next = { ...current, ...req.body, id };
  await upsertRecord(req.user.organizationId, collection, next);
  await writeAudit({
    user: req.user,
    action: 'RECORD_UPDATED',
    target: id,
    details: `Updated ${collection} record ${id}`,
    ip: req.ip
  });
  res.json(next);
});

workspaceRouter.delete('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!isWriteCollection(collection)) {
    res.status(400).json({ error: 'Unknown collection' });
    return;
  }
  if (!req.user || !hasPermission(req.user.role, collectionPermission(collection))) {
    res.status(403).json({ error: 'You do not have permission for this action' });
    return;
  }
  await deleteRecord(req.user.organizationId, collection, id);
  await writeAudit({
    user: req.user,
    action: 'RECORD_DELETED',
    target: id,
    details: `Deleted ${collection} record ${id}`,
    ip: req.ip
  });
  res.json({ ok: true });
});

workspaceRouter.get('/search', requirePermission('workspace.read'), async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) {
    res.json({ results: [] });
    return;
  }
  const rows = await prisma.tenantRecord.findMany({
    where: {
      ...tenantWhere(req),
      searchText: { contains: q }
    },
    take: 25
  });
  res.json({
    results: rows.map((row) => ({
      collection: row.collection,
      id: row.id,
      record: JSON.parse(row.payload)
    }))
  });
});
