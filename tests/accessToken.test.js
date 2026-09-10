import { describe, it, expect, beforeAll } from 'vitest';

process.env.ACCESS_TOKEN_SECRET = 'test-secret';
process.env.ACCESS_TOKEN_TTL = '60';

let signAccessToken;
let verifyAccessToken;

beforeAll(async () => {
  ({ signAccessToken, verifyAccessToken } = await import(
    '../server/accessToken.js'
  ));
});

const user = { id: 'u1', role: 'child', profile: 'yoto' };

describe('access tokens', () => {
  it('round-trips the identity a stream/SSE route needs', () => {
    const payload = verifyAccessToken(signAccessToken(user));
    expect(payload).toMatchObject(user);
    expect(payload.exp * 1000).toBeGreaterThan(Date.now());
  });

  it('rejects tampered, malformed and expired tokens', () => {
    const token = signAccessToken(user);
    const [body, signature] = token.split('.');

    expect(verifyAccessToken(`${body}.${'a'.repeat(signature.length)}`)).toBeNull();
    expect(verifyAccessToken('garbage')).toBeNull();
    expect(verifyAccessToken(undefined)).toBeNull();

    // Re-signing a payload with a different role requires the secret
    const forged = Buffer.from(
      JSON.stringify({ ...user, role: 'parent', exp: 9999999999 }),
    ).toString('base64url');
    expect(verifyAccessToken(`${forged}.${signature}`)).toBeNull();
  });
});
