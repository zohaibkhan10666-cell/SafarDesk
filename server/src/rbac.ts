export const ROLES = [
  'SUPER_ADMIN',
  'AGENCY_OWNER',
  'AGENCY_MANAGER',
  'TRAVEL_CONSULTANT',
  'VISA_OFFICER',
  'ACCOUNTANT',
  'OPERATIONS_STAFF',
  'BRANCH_MANAGER',
  'SUB_AGENT',
  'CUSTOMER'
] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
  | 'workspace.read'
  | 'workspace.write'
  | 'finance.write'
  | 'settings.write'
  | 'platform.admin'
  | 'documents.read'
  | 'documents.write';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ['workspace.read', 'workspace.write', 'finance.write', 'settings.write', 'platform.admin', 'documents.read', 'documents.write'],
  AGENCY_OWNER: ['workspace.read', 'workspace.write', 'finance.write', 'settings.write', 'documents.read', 'documents.write'],
  AGENCY_MANAGER: ['workspace.read', 'workspace.write', 'documents.read', 'documents.write'],
  TRAVEL_CONSULTANT: ['workspace.read', 'workspace.write', 'documents.read', 'documents.write'],
  VISA_OFFICER: ['workspace.read', 'workspace.write', 'documents.read', 'documents.write'],
  ACCOUNTANT: ['workspace.read', 'workspace.write', 'finance.write', 'documents.read'],
  OPERATIONS_STAFF: ['workspace.read', 'workspace.write', 'documents.read', 'documents.write'],
  BRANCH_MANAGER: ['workspace.read', 'workspace.write', 'documents.read', 'documents.write'],
  SUB_AGENT: ['workspace.read', 'workspace.write', 'documents.read'],
  CUSTOMER: ['workspace.read', 'documents.read']
};

export function hasPermission(role: string, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const WRITE_COLLECTIONS = [
  'leads',
  'customers',
  'visaCases',
  'quotations',
  'bookings',
  'payments',
  'tasks',
  'packages',
  'suppliers',
  'supplierLedger',
  'commissions',
  'travelCases',
  'subAgentCases',
  'whatsappTemplates',
  'documents'
] as const;

export type CollectionName = (typeof WRITE_COLLECTIONS)[number];

export function isWriteCollection(value: string): value is CollectionName {
  return (WRITE_COLLECTIONS as readonly string[]).includes(value);
}

export function collectionPermission(collection: string): Permission {
  if (collection === 'payments' || collection === 'commissions' || collection === 'supplierLedger') {
    return 'finance.write';
  }
  return 'workspace.write';
}
