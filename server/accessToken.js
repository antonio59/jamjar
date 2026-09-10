import crypto from 'crypto';
import logger from './logger.js';

// Short-lived signed tokens for the two places a custom auth header can't be
// sent: <audio src> and EventSource. They carry the same identity the session
// does, so the routes keep enforcing profile/role rules themselves.
const TTL_SECONDS = Math.max(
  30,
  parseInt(process.env.ACCESS_TOKEN_TTL || '300', 10) || 300,
);

let SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!SECRET) {
  SECRET = crypto.randomBytes(32).toString('hex');
  logger.warn('ACCESS_TOKEN_SECRET not set — using a random one; media tokens die on restart');
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function signAccessToken(user) {
  const body = Buffer.from(
    JSON.stringify({
      id: user.id,
      role: user.role,
      profile: user.profile,
      exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
    }),
  ).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifyAccessToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = sign(body);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const accessTokenTtl = TTL_SECONDS;
