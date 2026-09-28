import { prisma } from './prisma.js';
import type { AuthUser } from './auth.js';

export async function writeAudit(params: {
  user: AuthUser;
  action: string;
  target?: string;
  details: string;
  ip?: string;
}) {
  const org = await prisma.organization.findUnique({ where: { id: params.user.organizationId } });
  await prisma.auditLog.create({
    data: {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      organizationId: params.user.organizationId,
      userId: params.user.id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: params.user.name,
      role: params.user.role,
      action: params.action,
      target: params.target,
      details: params.details,
      branch: org?.headquarters || null,
      ip: params.ip || null
    }
  });
}
