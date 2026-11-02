export const categories = new Set(['BURNOUT', 'FAILURE', 'ANXIETY', 'DAILY']);
export const stickers = new Set(['WARM_TEA', 'HUG', 'STARRY_SKY']);
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const normalize = text => typeof text === 'string' ? text.normalize('NFKC').replace(/\p{Cf}/gu, '').trim() : '';
export const contentLength = text => [...normalize(text).replace(/\s/gu, '')].length;
export function inspectContent(value, maximum) {
  const text = normalize(value);
  const length = contentLength(text);
  const compressed = text.replace(/[\s\p{P}\p{S}\d]/gu, '').toLowerCase();
  const crisis = /자살|죽고\s*싶|목숨을?\s*끊|kill\s*myself|end\s*my\s*life|suicid/iu.test(text);
  if (crisis) return { ok: false, reason: 'CRISIS' };
  if (text.length > 3000 || length < 50 || length > maximum) return { ok: false, reason: 'LENGTH' };
  const contact = /(https?:|www\.|@[\p{L}\p{N}_]|(?:\d[\s().-]*){9,}|(?:카카오톡|카톡|텔레그램|telegram|디스코드|discord|인스타그램|instagram)\s*(?:아이디|id|계정|추가|연락)|\b[a-z0-9-]+\.(?:com|net|org|io|kr|co|me|app|gg)\b|\b0x[a-f0-9]{40}\b)/iu;
  const solicitation = /(?:계좌|송금|입금|비트코인|가상화폐|은행).{0,18}(?:보내|요청|부탁|후원|번호)|(?:돈|금전).{0,12}(?:보내|송금|후원)/iu;
  if (contact.test(text) || solicitation.test(text)) return { ok: false, reason: 'CONTACT_OR_MONEY' };
  if (/씨?발|시발|병신|ㅂㅅ|ㅈㄹ|fuck|bitch/iu.test(compressed)) return { ok: false, reason: 'ABUSE' };
  return { ok: true, text };
}
export function validateModeration(value) {
  if (!value || typeof value.score !== 'number' || !Number.isFinite(value.score) || value.score < 0 || value.score > 1 || typeof value.crisis !== 'boolean' || typeof value.humanReview !== 'boolean' || !Array.isArray(value.flags) || value.flags.length > 20 || value.flags.some(flag => typeof flag !== 'string' || !/^[A-Z_]{1,40}$/.test(flag))) throw new Error('INVALID_MODERATION');
  return value;
}
