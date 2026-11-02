import { config, json, sameOrigin, sessionToken, rpc } from '../lib/letter-server.mjs';
import { categories, stickers, uuid, inspectContent } from '../lib/letter-rules.mjs';
export default async function handler(req, res) {
  const cfg = config();
  const action = new URL(req.url, 'https://local.invalid').searchParams.get('action');
  if (req.method === 'GET' && action === 'config') return json(res, 200, { configured: Boolean(cfg), ready: Boolean(cfg && process.env.LETTERS_ENABLED === 'true' && process.env.LETTER_MODERATION_API_KEY && process.env.CRON_SECRET?.length >= 32) });
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: 'METHOD_NOT_ALLOWED' }); }
  if (!sameOrigin(req)) return json(res, 403, { error: 'ORIGIN_REJECTED' });
  if (!cfg || process.env.LETTERS_ENABLED !== 'true' || !process.env.LETTER_MODERATION_API_KEY || process.env.CRON_SECRET?.length < 32 || !process.env.CRON_SECRET) return json(res, 503, { error: 'NOT_CONFIGURED' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return json(res, 400, { error: 'INVALID_INPUT' }); } }
  if (!body || typeof body !== 'object' || Buffer.byteLength(JSON.stringify(body)) > 16000) return json(res, 400, { error: 'INVALID_INPUT' });
  try {
    const token = await sessionToken(req, res, cfg, action === 'session', body.captchaToken);
    if (action === 'session' || action === 'state') return json(res, 200, await rpc(cfg, 'letter_state', {}, token));
    if (action === 'requests') return json(res, 200, await rpc(cfg, 'letter_available_requests', {}, token));
    if (action === 'inbox') return json(res, 200, await rpc(cfg, 'letter_inbox', {}, token));
    if (action === 'request' || action === 'reply') {
      if (!uuid(body.nonce) || (action === 'request' && !categories.has(body.category)) || (action === 'reply' && (!uuid(body.requestId) || (body.sticker && !stickers.has(body.sticker))))) return json(res, 400, { error: 'INVALID_INPUT' });
      const checked = inspectContent(body.content, action === 'request' ? 300 : 400);
      if (!checked.ok) return json(res, 422, { error: checked.reason });
      const id = action === 'request'
        ? await rpc(cfg, 'letter_create_request', { p_category: body.category, p_content: checked.text, p_nonce: body.nonce }, token)
        : await rpc(cfg, 'letter_submit_reply', { p_request: body.requestId, p_content: checked.text, p_nonce: body.nonce, p_sticker: body.sticker || null }, token);
      return json(res, 202, { id, status: 'RECEIVED_FOR_REVIEW' });
    }
    if (action === 'react' && uuid(body.replyId) && stickers.has(body.sticker)) { await rpc(cfg, 'letter_react', { p_reply: body.replyId, p_sticker: body.sticker }, token); return json(res, 200, { ok: true }); }
    if (action === 'hide' && uuid(body.replyId)) { await rpc(cfg, 'letter_hide_and_block', { p_reply: body.replyId }, token); return json(res, 200, { ok: true }); }
    return json(res, 400, { error: 'INVALID_INPUT' });
  } catch (error) {
    if (error.message === 'AUTH_REQUIRED') return json(res, 401, { error: 'AUTH_REQUIRED' });
    const known = ['DAILY_REQUEST_LIMIT', 'COOLDOWN', 'SEND_UNAVAILABLE', 'REQUEST_UNAVAILABLE', 'REQUEST_FULL', 'LETTER_UNAVAILABLE', 'NONCE_CONFLICT'];
    const code = known.find(code => error.code?.includes(code));
    return json(res, code ? 409 : 503, { error: code || 'TEMPORARILY_UNAVAILABLE' });
  }
}
