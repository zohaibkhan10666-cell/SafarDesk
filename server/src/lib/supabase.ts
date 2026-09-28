import { createAdminClient, resolveEnv, verifyAuth } from '@supabase/server/core';

export type SupabaseEnvInfo = {
  configured: boolean;
  url: string | null;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  jwks: string | null;
  error?: string;
};

export type SupabaseTableStatus = {
  name: string;
  exists: boolean;
  count: number | null;
  error?: string;
};

export type SupabaseProbe = SupabaseEnvInfo & {
  reachable: boolean;
  restStatus: number | null;
  restMessage: string;
  jwksOk: boolean;
  jwksKeys: number;
  tables: SupabaseTableStatus[];
  missingTables: string[];
  ready: boolean;
};

let cachedAdmin: ReturnType<typeof createAdminClient> | null = null;

export function supabaseEnvInfo(): SupabaseEnvInfo {
  const { data, error } = resolveEnv();
  if (error || !data) {
    return {
      configured: false,
      url: null,
      hasPublishableKey: false,
      hasSecretKey: false,
      jwks: null,
      error: error?.message ?? 'SUPABASE_URL is not set'
    };
  }
  const jwks =
    data.jwks instanceof URL
      ? data.jwks.toString()
      : data.jwks
        ? 'inline'
        : null;
  return {
    configured: true,
    url: data.url,
    hasPublishableKey: Object.values(data.publishableKeys).some(Boolean),
    hasSecretKey: Object.values(data.secretKeys).some(Boolean),
    jwks
  };
}

export function getSupabaseAdmin() {
  if (!cachedAdmin) cachedAdmin = createAdminClient();
  return cachedAdmin;
}

async function probeRest(info: SupabaseEnvInfo) {
  if (!info.url) return { status: 0, message: 'No SUPABASE_URL' };
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEYS || '';
  try {
    const response = await fetch(`${info.url}/rest/v1/`, {
      headers: { apikey: secret, Authorization: `Bearer ${secret}` }
    });
    const body = await response.text();
    if (response.ok) return { status: response.status, message: 'PostgREST reachable' };
    return { status: response.status, message: body.slice(0, 200) };
  } catch (error) {
    return { status: 0, message: (error as Error).message };
  }
}

async function probeJwks(info: SupabaseEnvInfo) {
  const derived = info.url ? `${info.url}/auth/v1/.well-known/jwks.json` : null;
  const target = info.jwks === 'inline' ? null : (info.jwks ?? derived);
  if (info.jwks === 'inline') return { ok: true, keys: 0, message: 'Inline JWKS' };
  if (!target) return { ok: false, keys: 0, message: 'No JWKS URL' };
  try {
    const response = await fetch(target);
    if (!response.ok) return { ok: false, keys: 0, message: `JWKS HTTP ${response.status}` };
    const json = (await response.json()) as { keys?: unknown[] };
    const keys = Array.isArray(json.keys) ? json.keys.length : 0;
    return { ok: keys > 0, keys, message: keys > 0 ? 'JWKS keys loaded' : 'JWKS has no keys' };
  } catch (error) {
    return { ok: false, keys: 0, message: (error as Error).message };
  }
}

async function probeTable(admin: ReturnType<typeof createAdminClient>, name: string) {
  try {
    // GET (not HEAD): a HEAD response carries no body, so PostgREST's
    // "table not found" error cannot be read from it.
    const { count, error } = await admin.from(name).select('*', { count: 'exact' }).limit(1);
    if (error) {
      if (error.code === 'PGRST205') return { name, exists: false, count: null } satisfies SupabaseTableStatus;
      return { name, exists: false, count: null, error: error.message } satisfies SupabaseTableStatus;
    }
    return { name, exists: true, count: count ?? 0 } satisfies SupabaseTableStatus;
  } catch (error) {
    return { name, exists: false, count: null, error: (error as Error).message } satisfies SupabaseTableStatus;
  }
}

export async function probeSupabase(expectedTables: string[]): Promise<SupabaseProbe> {
  const info = supabaseEnvInfo();
  if (!info.configured) {
    return {
      ...info,
      reachable: false,
      restStatus: null,
      restMessage: info.error ?? 'Not configured',
      jwksOk: false,
      jwksKeys: 0,
      tables: [],
      missingTables: [],
      ready: false
    };
  }

  const rest = await probeRest(info);
  const jwks = await probeJwks(info);
  const reachable = rest.status > 0;

  let tables: SupabaseTableStatus[] = [];
  if (reachable && info.hasSecretKey) {
    const admin = getSupabaseAdmin();
    tables = await Promise.all(expectedTables.map((name) => probeTable(admin, name)));
  }

  const missingTables = tables.filter((table) => !table.exists).map((table) => table.name);
  return {
    ...info,
    reachable,
    restStatus: rest.status,
    restMessage: rest.message,
    jwksOk: jwks.ok,
    jwksKeys: jwks.keys,
    tables,
    missingTables,
    ready: reachable && jwks.ok && expectedTables.length > 0 && missingTables.length === 0
  };
}

/**
 * Verifies a Supabase access token (JWKS) using `@supabase/server` primitives.
 * Used by the Supabase Auth sign-in bridge.
 */
export async function verifySupabaseJwt(token: string) {
  const request = new Request('http://localhost/supabase/verify', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { data, error } = await verifyAuth(request, { auth: 'user' });
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? 'Supabase token could not be verified' };
  }
  return { ok: true as const, claims: (data.jwtClaims ?? data.userClaims ?? {}) as Record<string, string> };
}
