import { timingSafeEqual } from 'node:crypto';
export function config() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) return null;
  return { url: url.replace(/\/$/, ''), anon, service };
}
export function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}
export function sameOrigin(req) {
  try { return new URL(req.headers.origin).host === req.headers.host && req.headers['sec-fetch-site'] !== 'cross-site'; } catch { return false; }
}
export function validWorker(req) {
  const secret = process.env.CRON_SECRET;
  const received = req.headers.authorization || '';
  if (!secret || secret.length < 32) return false;
  const expected = `Bearer ${secret}`;
  const left = Buffer.from(received), right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
export async function remote(url, init = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(18000) });
  let body;
  try { body = await response.json(); } catch { throw new Error('UPSTREAM_UNAVAILABLE'); }
  if (!response.ok) {
    const error = new Error('UPSTREAM_REJECTED');
    error.status = response.status;
    // Supabase exception identifiers are used internally; never return raw error bodies.
    error.code = typeof body.message === 'string' ? body.message : '';
    throw error;
  }
  return body;
}
export function cookies(req) {
  const parsed = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    try { parsed[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1)); } catch {}
  }
  return parsed;
}
function setSession(res, session) {
  if (!session?.access_token || !session?.refresh_token || !session?.user?.id) throw new Error('AUTH_UNAVAILABLE');
  const common = '; HttpOnly; Secure; SameSite=Lax; Path=/api/letters';
  res.setHeader('Set-Cookie', [
    `__Secure-nd-access=${encodeURIComponent(session.access_token)}; Max-Age=${Math.min(session.expires_in || 3600, 3600)}${common}`,
    `__Secure-nd-refresh=${encodeURIComponent(session.refresh_token)}; Max-Age=2592000${common}`
  ]);
  return session.access_token;
}
export async function sessionToken(req, res, cfg, create = false, captchaToken = null) {
  const saved = cookies(req);
  if (saved['__Secure-nd-access']) {
    try {
      await remote(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.anon, Authorization: `Bearer ${saved['__Secure-nd-access']}` } });
      return saved['__Secure-nd-access'];
    } catch (error) { if (error.status !== 401 && error.status !== 403) throw error; }
  }
  if (saved['__Secure-nd-refresh']) {
    try {
      const renewed = await remote(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: cfg.anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: saved['__Secure-nd-refresh'] }) });
      return setSession(res, renewed);
    } catch (error) { if (error.status !== 400 && error.status !== 401 && error.status !== 403) throw error; }
  }
  if (!create) throw new Error('AUTH_REQUIRED');
  const session = await remote(`${cfg.url}/auth/v1/signup`, { method: 'POST', headers: { apikey: cfg.anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: {}, gotrue_meta_security: { captcha_token: captchaToken || undefined } }) });
  return setSession(res, session);
}
export async function rpc(cfg, name, args = {}, token = cfg.service) {
  return remote(`${cfg.url}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: token === cfg.service ? cfg.service : cfg.anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
}
