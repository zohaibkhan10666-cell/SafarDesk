import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { addContactMessage } from '../contactInbox.js';

/**
 * Anonymous catalog endpoints â€” the public marketing site (README Â§19.1) reads the
 * exact subscription plans the Super Admin authors in the platform console, so home
 * & pricing always advertise current pricing, quotas and features.
 *
 * Mounted without authentication on purpose: no tenant or buyer data leaves here,
 * only the sellable plan cards and the contact requests a visitor chooses to send.
 */
export const publicRouter = Router();

type PublicPlanRow = {
  id: string;
  name: string;
  price: number;
  roles: number;
  branches: number;
  storageGB: number;
  features: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

publicRouter.get('/plans', async (_req, res) => {
  try {
    const rows = (await prisma.plan.findMany()) as unknown as PublicPlanRow[];
    const plans = rows
      .filter((plan) => plan.isActive !== false)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        roles: plan.roles,
        branches: plan.branches,
        storageGB: plan.storageGB,
        features: plan.features,
        description: plan.description || '',
        sortOrder: plan.sortOrder,
        isActive: plan.isActive
      }))
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.price - b.price || a.name.localeCompare(b.name)
      );
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/* ------------------------------------------------------------------ */
/* Contact requests from the public site's home & contact sections.    */
/* Anonymous by design — the visitor has no session yet, so the row is  */
/* platform-owned and read back only by the Super Admin console.       */
/* ------------------------------------------------------------------ */

const contactSchema = z.object({
  id: z.string().trim().max(80).optional(),
  firstName: z.string().trim().max(80).optional().default(''),
  lastName: z.string().trim().max(80).optional().default(''),
  email: z.string().trim().max(160).email('Enter a valid email address'),
  agency: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().min(3, 'Tell us a little more').max(4000),
  source: z.enum(['home', 'contact']).optional().default('contact')
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages from this network — please try again shortly.' }
});

publicRouter.post('/contact', contactLimiter, (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid contact request' });
  }
  try {
    const message = addContactMessage(parsed.data);
    res.status(201).json({ message, delivered: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
