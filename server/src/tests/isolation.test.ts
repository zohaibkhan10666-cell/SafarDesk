import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../env.js';

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.findUnique({ where: { id: 'u-1' } });
  const other = await prisma.user.findUnique({ where: { id: 'u-org2' } });
  if (!owner || !other) {
    throw new Error('Seed users missing. Run npm run db:reset in /server first.');
  }

  const ownerToken = jwt.sign(
    {
      id: owner.id,
      organizationId: owner.organizationId,
      email: owner.email,
      name: owner.name,
      role: owner.role,
      branchId: owner.branchId
    },
    env.jwtSecret,
    { expiresIn: '1h' }
  );

  const secret = await prisma.tenantRecord.findUnique({
    where: {
      organizationId_collection_id: { organizationId: owner.organizationId, collection: 'leads', id: 'LEAD-SECRET' }
    }
  });
  if (secret) {
    throw new Error('Tenant isolation failed: org-1 can see org-2 LEAD-SECRET in the database query without org filter.');
  }

  const scoped = await prisma.tenantRecord.findMany({
    where: { organizationId: owner.organizationId, collection: 'leads' }
  });
  const leaked = scoped.some((row) => row.id === 'LEAD-SECRET');
  if (leaked) {
    throw new Error('Tenant isolation failed: leaked LEAD-SECRET into org-1 collection');
  }

  const otherLead = await prisma.tenantRecord.findUnique({
    where: {
      organizationId_collection_id: { organizationId: 'org-2', collection: 'leads', id: 'LEAD-SECRET' }
    }
  });
  if (!otherLead) {
    throw new Error('Expected org-2 private lead to exist');
  }

  if (!ownerToken) throw new Error('JWT signing failed');
  console.log('Tenant isolation checks passed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
