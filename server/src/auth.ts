import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { prisma } from './prisma.js';
import { hasPermission, type Permission } from './rbac.js';

export type AuthUser = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: string;
  branchId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
      role: user.role,
      branchId: user.branchId
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      res.status(403).json({ error: 'You do not have permission for this action' });
      return;
    }
    next();
  };
}

export function tenantWhere(req: Request) {
  if (!req.user) throw new Error('Unauthenticated');
  return { organizationId: req.user.organizationId };
}
