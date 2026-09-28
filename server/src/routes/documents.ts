import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { prisma } from '../prisma.js';
import { requireAuth, requirePermission, tenantWhere } from '../auth.js';
import { hasPermission } from '../rbac.js';
import { writeAudit } from '../audit.js';
import { enforceTenantPolicy } from '../enforce.js';
import { policy } from '../platformConfig.js';
import {
  MAX_UPLOAD_BYTES,
  putDocument,
  readDocument,
  removeDocument
} from '../lib/documentStorage.js';

export const documentsRouter = Router();
documentsRouter.use(requireAuth);
documentsRouter.use(enforceTenantPolicy);

/** 1 MB granularity — matches the `storageUsedMB` (Int) accounting column. */
const BYTES_PER_MB = 1024 * 1024;
const toMB = (bytes: number) => Math.max(1, Math.ceil((bytes || 0) / BYTES_PER_MB));

/** RFC 6266 attachment header that keeps the original (possibly UTF-8) name. */
function contentDisposition(filename: string): string {
  const ascii = String(filename || 'download').replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename || 'download')}`;
}

// Files are buffered in memory and handed to Supabase Storage (see lib/documentStorage).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

const documentCategories = [
  'Passport', 'CNIC', 'Photograph', 'Bank Document', 'Employment Document',
  'Invitation Letter', 'Hotel Voucher', 'Flight Ticket', 'Visa', 'Insurance',
  'Application Form', 'Other'
] as const;

documentsRouter.get('/', requirePermission('documents.read'), async (req, res) => {
  const { page = '1', limit = '25', category, customer, traveller, status, search } = req.query;
  
  const where: any = { ...tenantWhere(req) };
  if (category) where.category = category;
  if (customer) where.customer = { contains: String(customer) };
  if (traveller) where.traveller = { contains: String(traveller) };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { customer: { contains: String(search), mode: 'insensitive' } },
      { notes: { contains: String(search), mode: 'insensitive' } }
    ];
  }
  
  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.document.count({ where })
  ]);
  
  res.json({
    data: documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      category: doc.category,
      customer: doc.customer,
      traveller: doc.traveller,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      size: `${(doc.sizeBytes / 1024).toFixed(1)} KB`,
      status: doc.status,
      uploadedBy: doc.uploadedBy,
      expiryDate: doc.expiryDate,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      downloadUrl: `/api/v1/documents/${doc.id}/download`
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

documentsRouter.get('/categories', requirePermission('documents.read'), (_req, res) => {
  res.json({ categories: documentCategories });
});

documentsRouter.get('/stats/summary', requirePermission('documents.read'), async (req, res) => {
  const where = tenantWhere(req);
  const [total, byCategory, byStatus, expiringSoon] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.groupBy({ by: ['category'], where, _count: { id: true } }),
    prisma.document.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.document.count({
      where: {
        ...where,
        expiryDate: { not: null, lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      }
    })
  ]);
  
  res.json({
    total,
    byCategory: byCategory.reduce((acc, c) => ({ ...acc, [c.category]: c._count.id }), {}),
    byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
    expiringSoon
  });
});

documentsRouter.get('/:id', requirePermission('documents.read'), async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: String(req.params.id), ...tenantWhere(req) }
  });
  
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  
  res.json({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    customer: doc.customer,
    traveller: doc.traveller,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    size: `${(doc.sizeBytes / 1024).toFixed(1)} KB`,
    status: doc.status,
    uploadedBy: doc.uploadedBy,
    expiryDate: doc.expiryDate,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    downloadUrl: `/api/v1/documents/${doc.id}/download`
  });
});

documentsRouter.post('/', requirePermission('documents.write'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  
  const { category, customer, traveller, status = 'UPLOADED', expiryDate, notes } = req.body;
  
  if (!category || !documentCategories.includes(category as typeof documentCategories[number])) {
    res.status(400).json({ error: 'Invalid or missing category' });
    return;
  }

  const tenant = await prisma.organization.findUnique({ where: { id: req.user!.organizationId } });
  const incomingMB = toMB(req.file.size);
  const quota = policy.storage(tenant?.plan || 'STARTER', tenant?.storageUsedMB || 0, incomingMB);
  if (!quota.allowed) {
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_ENFORCEMENT_BLOCK',
      target: req.file.originalname,
      details: `Upload rejected — ${quota.reason}`,
      ip: req.ip
    });
    res.status(409).json({ error: quota.reason, ruleId: quota.ruleId, scope: quota.scope, mode: quota.mode });
    return;
  }

  // Bytes go to Supabase Storage (private bucket) — see lib/documentStorage.
  const storagePath = await putDocument(req.user!.organizationId, {
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  let doc;
  try {
    doc = await prisma.document.create({
      data: {
        id: randomUUID(),
        organizationId: req.user!.organizationId,
        name: req.file.originalname,
        category,
        customer: customer || null,
        traveller: traveller || null,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storagePath,
        status,
        uploadedBy: req.user!.name,
        expiryDate: expiryDate || null,
        notes: notes || null,
        payload: '{}'
      }
    });
  } catch (error) {
    await removeDocument(storagePath);
    throw error;
  }

  if (tenant) {
    await prisma.organization.update({
      where: { id: tenant.id },
      data: { storageUsedMB: tenant.storageUsedMB + incomingMB }
    });
  }

  await writeAudit({
    user: req.user!,
    action: 'DOCUMENT_UPLOADED',
    target: doc.id,
    details: `Uploaded document ${doc.name} (${doc.category})`,
    ip: req.ip
  });
  
  res.status(201).json({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    customer: doc.customer,
    traveller: doc.traveller,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    size: `${(doc.sizeBytes / 1024).toFixed(1)} KB`,
    status: doc.status,
    uploadedBy: doc.uploadedBy,
    expiryDate: doc.expiryDate,
    notes: doc.notes,
    createdAt: doc.createdAt,
    downloadUrl: `/api/v1/documents/${doc.id}/download`
  });
});

documentsRouter.patch('/:id', requirePermission('documents.write'), async (req, res) => {
  const { category, customer, traveller, status, expiryDate, notes } = req.body;
  
  const updateData: any = {};
  if (category && documentCategories.includes(category)) updateData.category = category;
  if (customer !== undefined) updateData.customer = customer || null;
  if (traveller !== undefined) updateData.traveller = traveller || null;
  if (status) updateData.status = status;
  if (expiryDate !== undefined) updateData.expiryDate = expiryDate || null;
  if (notes !== undefined) updateData.notes = notes || null;
  
  const doc = await prisma.document.update({
    where: { id: String(req.params.id) },
    data: updateData
  });
  
  await writeAudit({
    user: req.user!,
    action: 'DOCUMENT_UPDATED',
    target: doc.id,
    details: `Updated document ${doc.name}`,
    ip: req.ip
  });
  
  res.json({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    customer: doc.customer,
    traveller: doc.traveller,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    uploadedBy: doc.uploadedBy,
    expiryDate: doc.expiryDate,
    notes: doc.notes,
    downloadUrl: `/api/v1/documents/${doc.id}/download`
  });
});

documentsRouter.post('/:id/replace', requirePermission('documents.write'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  
  const id = String(req.params.id);
  const existing = await prisma.document.findFirst({
    where: { id, ...tenantWhere(req) }
  });
  
  if (!existing) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const tenant = await prisma.organization.findUnique({ where: { id: req.user!.organizationId } });
  const incomingMB = toMB(req.file.size);
  const deltaMB = incomingMB - toMB(existing.sizeBytes);
  const quota = policy.storage(tenant?.plan || 'STARTER', tenant?.storageUsedMB || 0, deltaMB);
  if (!quota.allowed) {
    await writeAudit({
      user: req.user!,
      action: 'PLATFORM_ENFORCEMENT_BLOCK',
      target: existing.name,
      details: `Replacement rejected — ${quota.reason}`,
      ip: req.ip
    });
    res.status(409).json({ error: quota.reason, ruleId: quota.ruleId, scope: quota.scope, mode: quota.mode });
    return;
  }

  const storagePath = await putDocument(req.user!.organizationId, {
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  let doc;
  try {
    doc = await prisma.document.update({
      where: { id },
      data: {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storagePath,
        status: 'UPLOADED',
        uploadedBy: req.user!.name
      }
    });
  } catch (error) {
    await removeDocument(storagePath);
    throw error;
  }

  // The superseded object is only dropped once the row points at the new one.
  if (existing.storagePath && existing.storagePath !== storagePath) {
    await removeDocument(existing.storagePath);
  }

  if (tenant) {
    await prisma.organization.update({
      where: { id: tenant.id },
      data: { storageUsedMB: Math.max(0, tenant.storageUsedMB + deltaMB) }
    });
  }
  
  await writeAudit({
    user: req.user!,
    action: 'DOCUMENT_REPLACED',
    target: doc.id,
    details: `Replaced document ${doc.name}`,
    ip: req.ip
  });
  
  res.json({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    customer: doc.customer,
    traveller: doc.traveller,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    uploadedBy: doc.uploadedBy,
    downloadUrl: `/api/v1/documents/${doc.id}/download`
  });
});

documentsRouter.get('/:id/download', requirePermission('documents.read'), async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: String(req.params.id), ...tenantWhere(req) }
  });
  
  if (!doc || !doc.storagePath) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  // Supabase Storage first, local vault for rows written before the migration.
  const buffer = await readDocument(doc.storagePath);
  if (!buffer) {
    res.status(404).json({ error: 'Document content not found in storage' });
    return;
  }
  
  await writeAudit({
    user: req.user!,
    action: 'DOCUMENT_DOWNLOADED',
    target: doc.id,
    details: `Downloaded document ${doc.name}`,
    ip: req.ip
  });

  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', String(buffer.length));
  res.setHeader('Content-Disposition', contentDisposition(doc.name));
  res.setHeader('Cache-Control', 'private, max-age=0, no-store');
  res.end(buffer);
});

documentsRouter.delete('/:id', requirePermission('documents.write'), async (req, res) => {
  const id = String(req.params.id);
  const doc = await prisma.document.findFirst({
    where: { id, ...tenantWhere(req) }
  });
  
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  
  await prisma.document.delete({ where: { id } });

  // Drop the stored object from Supabase Storage (and the local fallback).
  if (doc.storagePath) {
    await removeDocument(doc.storagePath);
  }

  const tenant = await prisma.organization.findUnique({ where: { id: doc.organizationId } });
  if (tenant) {
    await prisma.organization.update({
      where: { id: tenant.id },
      data: { storageUsedMB: Math.max(0, tenant.storageUsedMB - toMB(doc.sizeBytes)) }
    });
  }
  
  await writeAudit({
    user: req.user!,
    action: 'DOCUMENT_DELETED',
    target: doc.id,
    details: `Deleted document ${doc.name}`,
    ip: req.ip
  });
  
  res.json({ ok: true });
});