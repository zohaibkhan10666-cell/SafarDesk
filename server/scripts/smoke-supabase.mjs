const base = 'http://localhost:4000/api/v1';

async function call(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let data = {};
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

const results = [];
const log = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

async function main() {
  const login = await call('/auth/login', { method: 'POST', body: { email: 'nina.v@example.com', password: 'SafarDesk@2026' } });
  log('super admin login', login.status === 200, `status=${login.status}`);
  const token = login.data.token;

  const status = await call('/platform/supabase', { token });
  const p = status.data?.probe || {};
  const setupInfo = status.data?.setup || {};
  log(
    'GET platform/supabase (connected)',
    status.status === 200 && p.ready === true && (p.missingTables || []).length === 0,
    `tables=${p.tables?.length} missing=${p.missingTables?.length} ready=${p.ready} host=${setupInfo.host} dsn=${setupInfo.channels?.dsnVar}`
  );
  console.log('   counts:', JSON.stringify((p.tables || []).map((t) => `${t.name}:${t.count}`)));
  console.log('   local :', JSON.stringify(status.data?.local));

  const sql = await fetch(`${base}/platform/supabase/sql`, { headers: { Authorization: `Bearer ${token}` } });
  const sqlText = await sql.text();
  log('GET platform/supabase/sql', sql.status === 200 && sqlText.includes('CREATE TABLE "Organization"'), `bytes=${sqlText.length}`);

  const setup = await call('/platform/supabase/setup', { method: 'POST', token });
  log(
    'POST setup (idempotent re-run)',
    setup.status === 200 && setup.data?.setup?.ok === true,
    `status=${setup.status} channel=${setup.data?.setup?.channel} msg=${setup.data?.setup?.message}`
  );

  const sync = await call('/platform/supabase/sync', { method: 'POST', token });
  const synced = (sync.data?.sync?.results || []).filter((r) => !r.error);
  log(
    'POST sync (rows mirrored)',
    sync.status === 200 && sync.data?.sync?.ok === true && synced.length === 8,
    `status=${sync.status} msg=${sync.data?.sync?.message}`
  );

  const preview = await call('/platform/supabase/preview?table=Organization&limit=3', { token });
  log(
    'GET preview (rows read back)',
    preview.status === 200 && (preview.data?.rows || []).length > 0,
    `count=${preview.data?.count} first=${preview.data?.rows?.[0]?.name}`
  );

  const auth = await call('/auth/supabase', { method: 'POST', body: { supabase_token: 'not-a-jwt' } });
  log('POST auth/supabase (bad token → 401)', auth.status === 401, `status=${auth.status}`);

  const noAuth = await call('/platform/supabase');
  log('platform/supabase requires auth', noAuth.status === 401, `status=${noAuth.status}`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error('SMOKE ERROR', error);
  process.exit(1);
});
