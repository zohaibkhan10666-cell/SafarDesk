import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Platform contact inbox — requests submitted on the public marketing site
 * (README §19 · home & contact sections).
 *
 * Anonymous visitors have no tenant, so these rows are platform-owned: they live
 * next to `data/platform-config.json` rather than in a tenant partition. The Super
 * Admin console reads them through GET /api/v1/platform/contact-messages.
 *
 * Writes are best-effort and buffered in memory, exactly like the platform config.
 */

export type ContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  agency: string;
  message: string;
  source: string;
  status: 'NEW' | 'READ';
  createdAt: string;
  updatedAt: string;
};

export type ContactMessageInput = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  agency?: string;
  message?: string;
  source?: string;
};

const INBOX_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'contact-inbox.json'
);

const MAX_MESSAGES = 500;

let messages: ContactMessage[] = [];

function loadInbox() {
  try {
    const raw = fs.readFileSync(INBOX_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { messages?: ContactMessage[] };
    messages = Array.isArray(parsed.messages) ? parsed.messages.filter((row) => row && row.id) : [];
  } catch {
    // First boot or unreadable file — the inbox starts empty.
  }
}

function persistInbox() {
  try {
    fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true });
    fs.writeFileSync(INBOX_PATH, `${JSON.stringify({ messages }, null, 2)}\n`, 'utf8');
  } catch {
    // Persistence is best-effort; the in-memory inbox keeps serving the console.
  }
}

loadInbox();

function newId(): string {
  return `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listContactMessages(): ContactMessage[] {
  return [...messages].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function addContactMessage(input: ContactMessageInput): ContactMessage {
  const now = new Date().toISOString();
  const id = String(input.id || '').trim() || newId();
  const record: ContactMessage = {
    id,
    firstName: String(input.firstName || '').trim().slice(0, 80),
    lastName: String(input.lastName || '').trim().slice(0, 80),
    email: String(input.email || '').trim().slice(0, 160),
    agency: String(input.agency || '').trim().slice(0, 120),
    message: String(input.message || '').trim().slice(0, 4000),
    source: ['home', 'contact'].includes(String(input.source)) ? String(input.source) : 'contact',
    status: 'NEW',
    createdAt: now,
    updatedAt: now
  };

  // The browser mirrors the row locally before POSTing, so the same id may arrive twice.
  const existingIndex = messages.findIndex((row) => row.id === record.id);
  if (existingIndex >= 0) messages[existingIndex] = record;
  else messages.unshift(record);

  if (messages.length > MAX_MESSAGES) messages = messages.slice(0, MAX_MESSAGES);
  persistInbox();
  return record;
}

export function updateContactMessage(
  id: string,
  patch: { status?: string }
): ContactMessage | null {
  const target = messages.find((row) => row.id === id);
  if (!target) return null;
  if (patch.status) {
    target.status = String(patch.status).toUpperCase() === 'READ' ? 'READ' : 'NEW';
    target.updatedAt = new Date().toISOString();
    persistInbox();
  }
  return target;
}

export function removeContactMessage(id: string): boolean {
  const next = messages.filter((row) => row.id !== id);
  if (next.length === messages.length) return false;
  messages = next;
  persistInbox();
  return true;
}
