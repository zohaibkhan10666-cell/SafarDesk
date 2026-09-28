import { api } from './api';

/**
 * Shared subscription-plan catalog for the public site (README §19.1).
 *
 * The Super Admin authors plans in the platform console; the public home & pricing
 * sections read the very same catalog so new visitors always see current pricing.
 *
 * Resolution order:
 *   1. GET /api/v1/public/plans  (anonymous, live catalog)
 *   2. localStorage mirror        (written by the Super Admin console — offline/other tab)
 *   3. bundled defaults           (rendered by PublicSite when both sources are empty)
 */
export const PUBLIC_PLANS_CACHE_KEY = 'safardesk.public.plans';

function toNumber(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitFeatures(raw) {
  if (Array.isArray(raw)) return raw.map((feature) => String(feature).trim()).filter(Boolean);
  return String(raw || '')
    .split(/[,•]/)
    .map((feature) => feature.trim())
    .filter((feature) => feature && feature !== '—');
}

/** Catalog rows (server or cached) → the card shape the public site renders. */
export function toPublicPlans(rows) {
  if (!Array.isArray(rows)) return [];
  const plans = rows
    .filter((row) => row && row.id && row.isActive !== false)
    .map((row) => ({
      id: row.id,
      name: row.name || row.id,
      price: toNumber(row.price),
      description: String(row.description || '').trim(),
      roles: toNumber(row.roles),
      branches: toNumber(row.branches),
      storageGB: toNumber(row.storageGB),
      features: splitFeatures(row.features),
      sortOrder: toNumber(row.sortOrder)
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price || a.name.localeCompare(b.name))
    .map((plan) => {
      const bullets = [];
      if (plan.roles > 0) bullets.push(`${plan.roles} team role${plan.roles === 1 ? '' : 's'}`);
      if (plan.branches > 0) bullets.push(`${plan.branches} branch${plan.branches === 1 ? '' : 'es'}`);
      if (plan.storageGB > 0) bullets.push(`${plan.storageGB} GB secure vault`);
      plan.features.forEach((feature) => bullets.push(feature));
      const unique = bullets.filter((item, index) => bullets.indexOf(item) === index);
      return {
        id: plan.id,
        name: plan.name,
        price: plan.price.toLocaleString('en-US'),
        description: plan.description,
        features: unique.length ? unique.slice(0, 8) : ['Core workspace modules'],
        popular: false
      };
    });

  if (!plans.length) return [];
  const popularIndex = Math.floor((plans.length - 1) / 2);
  plans[popularIndex] = { ...plans[popularIndex], popular: true };
  return plans;
}

export function readCachedPublicPlans() {
  try {
    const raw = localStorage.getItem(PUBLIC_PLANS_CACHE_KEY);
    if (!raw) return [];
    return toPublicPlans(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** Super Admin console calls this after every create / edit / retire / delete. */
export function writePublicPlansCache(rows) {
  try {
    if (Array.isArray(rows) && rows.length) {
      localStorage.setItem(PUBLIC_PLANS_CACHE_KEY, JSON.stringify(rows));
    } else {
      localStorage.removeItem(PUBLIC_PLANS_CACHE_KEY);
    }
  } catch {
    // Storage unavailable (private mode) — the live endpoint still serves the catalog.
  }
}

/** Live catalog when the API answers, otherwise the last Super Admin snapshot. */
export async function loadPublicPlans() {
  try {
    const data = await api.public.plans();
    const rows = Array.isArray(data?.plans) ? data.plans : [];
    // Mirror the API answer even when it retires every plan, then render it.
    writePublicPlansCache(rows);
    return toPublicPlans(rows);
  } catch {
    // Offline / older API — fall back to the mirror, then to the bundled defaults.
  }
  return readCachedPublicPlans();
}
