import { api } from './api';

/**
 * Public-site contact requests (README §19 · Platform console "Contact Requests").
 *
 * The home & contact sections of the marketing site POST their message form here.
 * Every submission is:
 *   1. mirrored to localStorage immediately (works offline / before the API answers)
 *   2. sent to POST /api/v1/public/contact — anonymous, rate-limited, no auth required
 *   3. read back by the Super Admin console (GET /api/v1/platform/contact-messages)
 *
 * Resolution order when the console loads:
 *   1. GET /api/v1/platform/contact-messages (live inbox on the API host)
 *   2. localStorage mirror (submissions made while the API was unreachable)
 * Rows are merged by id, so a message stored on both sides appears exactly once.
 */
export const CONTACT_INBOX_KEY = 'safardesk.contact.inbox';

const MAX_MIRRORED = 200;

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `cm-${crypto.randomUUID()}`;
  return `cm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalize(row) {
  if (!row || typeof row !== 'object') return null;
  const id = String(row.id || '').trim();
  if (!id) return null;
  return {
    id,
    firstName: String(row.firstName || '').trim(),
    lastName: String(row.lastName || '').trim(),
    email: String(row.email || '').trim(),
    agency: String(row.agency || '').trim(),
    message: String(row.message || '').trim(),
    source: String(row.source || 'contact'),
    status: String(row.status || 'NEW').toUpperCase() === 'READ' ? 'READ' : 'NEW',
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || row.createdAt || new Date().toISOString()
  };
}

export function readLocalContactMessages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONTACT_INBOX_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter(Boolean);
  } catch {
    return [];
  }
}

function writeLocalContactMessages(rows) {
  try {
    const list = (Array.isArray(rows) ? rows : []).map(normalize).filter(Boolean).slice(0, MAX_MIRRORED);
    localStorage.setItem(CONTACT_INBOX_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private mode) — the API inbox still keeps the message.
  }
}

function newerOf(a, b) {
  const at = Date.parse(a.updatedAt || a.createdAt || '') || 0;
  const bt = Date.parse(b.updatedAt || b.createdAt || '') || 0;
  return bt > at ? b : a;
}

function mergeById(serverRows, localRows) {
  const byId = new Map();
  // Local mirror first, API rows second — a message stored on both sides
  // collapses into a single row instead of showing up twice. The most recently
  // touched copy wins, so a status change made while the API was down is not
  // overwritten by a stale server row on the next load.
  for (const row of [...(localRows || []), ...(serverRows || [])]) {
    const item = normalize(row);
    if (!item) continue;
    const existing = byId.get(item.id);
    byId.set(item.id, existing ? newerOf(existing, item) : item);
  }
  return [...byId.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

/** Home / contact section submit — always recorded locally, then pushed to the API. */
export async function submitContactMessage(fields = {}, source = 'contact') {
  const now = new Date().toISOString();
  const record = normalize({
    id: newId(),
    firstName: fields.firstName,
    lastName: fields.lastName,
    email: fields.email,
    agency: fields.agency,
    message: fields.message,
    source,
    status: 'NEW',
    createdAt: now,
    updatedAt: now
  });

  const local = readLocalContactMessages();
  writeLocalContactMessages([record, ...local]);

  try {
    const data = await api.public.contact(record);
    const saved = normalize(data?.message);
    if (saved) {
      writeLocalContactMessages([saved, ...readLocalContactMessages().filter(row => row.id !== saved.id)]);
      return { ok: true, message: saved, synced: true };
    }
  } catch {
    // Offline / older API — the mirror still holds the request for the console.
  }
  return { ok: true, message: record, synced: false };
}

/** Merged inbox for the Super Admin console: live API rows plus unsynced local rows. */
export async function loadContactMessages() {
  let server = [];
  try {
    const data = await api.platform.contactMessages();
    server = Array.isArray(data?.messages) ? data.messages : [];
  } catch {
    // Offline / older API — the local mirror is the inbox.
  }
  return mergeById(server, readLocalContactMessages());
}

function patchLocal(id, patch) {
  writeLocalContactMessages(readLocalContactMessages().map(row => (row.id === id ? { ...row, ...patch } : row)));
}

function dropLocal(id) {
  writeLocalContactMessages(readLocalContactMessages().filter(row => row.id !== id));
}

/** NEW ⇄ READ from the console — mirrored locally first so it works offline. */
export async function setContactMessageStatus(id, status) {
  const next = String(status).toUpperCase() === 'READ' ? 'READ' : 'NEW';
  const updatedAt = new Date().toISOString();
  patchLocal(id, { status: next, updatedAt });
  try {
    await api.platform.updateContactMessage(id, { status: next });
  } catch {
    // Offline — the mirrored status still renders in the console.
  }
  return next;
}

export async function removeContactMessage(id) {
  dropLocal(id);
  try {
    await api.platform.deleteContactMessage(id);
  } catch {
    // Offline — the row is already removed from this browser's mirror.
  }
}
