import { prisma } from './prisma.js';
import type { CollectionName } from './rbac.js';

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function searchTextFrom(payload: Record<string, unknown>) {
  return [
    payload.id,
    payload.name,
    payload.customerName,
    payload.phone,
    payload.email,
    payload.destination,
    payload.referenceNumber,
    payload.bookingCode,
    payload.quotationNumber,
    payload.receiptNumber
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export async function listCollection(organizationId: string, collection: CollectionName) {
  const rows = await prisma.tenantRecord.findMany({
    where: { organizationId, collection },
    orderBy: { createdAt: 'desc' }
  });
  return rows.map((row) => parseJson(row.payload, {}));
}

export async function replaceCollection(
  organizationId: string,
  collection: CollectionName,
  items: Array<Record<string, unknown>>
) {
  await prisma.$transaction(async (tx) => {
    await tx.tenantRecord.deleteMany({ where: { organizationId, collection } });
    if (!items.length) return;
    await tx.tenantRecord.createMany({
      data: items.map((item) => ({
        organizationId,
        collection,
        id: String(item.id ?? `${collection}-${Date.now()}`),
        payload: JSON.stringify(withVisaCompletion(item)),
        searchText: searchTextFrom(item)
      }))
    });
  });
}

export async function upsertRecord(
  organizationId: string,
  collection: CollectionName,
  item: Record<string, unknown>
) {
  const id = String(item.id);
  const payload = JSON.stringify(withVisaCompletion(item));
  await prisma.tenantRecord.upsert({
    where: {
      organizationId_collection_id: { organizationId, collection, id }
    },
    create: {
      organizationId,
      collection,
      id,
      payload,
      searchText: searchTextFrom(item)
    },
    update: {
      payload,
      searchText: searchTextFrom(item)
    }
  });
}

export async function deleteRecord(organizationId: string, collection: CollectionName, id: string) {
  await prisma.tenantRecord.delete({
    where: { organizationId_collection_id: { organizationId, collection, id } }
  });
}

function withVisaCompletion(item: Record<string, unknown>) {
  const checklists = item.checklists as Array<{ status: string }> | undefined;
  if (!Array.isArray(checklists)) return item;
  const verified = checklists.filter((c) => c.status === 'VERIFIED' || c.status === 'UPLOADED').length;
  return {
    ...item,
    completionPercentage: checklists.length ? Math.round((verified / checklists.length) * 100) : 0
  };
}
