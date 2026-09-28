import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const jwksUrl = import.meta.env.VITE_SUPABASE_JWKS_URL;

export const supabaseEnv = {
  url: url || null,
  publishableKey: publishableKey ? `${publishableKey.slice(0, 16)}…` : null,
  jwksUrl: jwksUrl || null
};

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  : null;

/**
 * Browser → Supabase connectivity using the publishable key only.
 * Proves the frontend can reach the project without exposing the secret key.
 */
export async function checkSupabaseFromBrowser() {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      ok: false,
      message: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the root .env file'
    };
  }
  try {
    const authResponse = await fetch(`${url}/auth/v1/health`, { headers: { apikey: publishableKey } });
    if (!authResponse.ok) {
      return { configured: true, ok: false, message: `Auth service returned HTTP ${authResponse.status}` };
    }
    const auth = await authResponse.json();
    const restResponse = await fetch(`${url}/rest/v1/`, { headers: { apikey: publishableKey } });
    return {
      configured: true,
      ok: true,
      version: auth.version,
      restStatus: restResponse.status,
      message: 'Browser connected to Supabase (auth + REST reachable)'
    };
  } catch (error) {
    return { configured: true, ok: false, message: (error && error.message) || 'Browser could not reach Supabase' };
  }
}
