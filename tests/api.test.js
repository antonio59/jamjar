import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { createHash } from 'crypto';
import request from 'supertest';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jamjar-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.DOWNLOAD_DIR = path.join(tmpDir, 'downloads');
process.env.YOUTUBE_API_KEY = '';

// Never shell out to yt-dlp from the test suite
vi.mock('../server/downloader.js', () => ({
  downloadAndUpload: vi.fn(async () => {}),
}));

let app;
let parentSession;
let childSession;

function readCookie(res, name) {
  const header = (res.headers['set-cookie'] || []).find((c) =>
    c.startsWith(`${name}=`),
  );
  return header ? header.split(';')[0].slice(name.length + 1) : null;
}

// The session id only ever leaves the server in an httpOnly cookie; tests read
// it back out and keep using the X-Session-Id header for brevity.
async function login(username, pin) {
  const res = await request(app).post('/api/auth/login').send({ username, pin });
  expect(res.status).toBe(200);
  return readCookie(res, 'jj_session');
}

let db;

beforeAll(async () => {
  const database = await import('../server/database.js');
  const { createUser } = database;
  db = database.default;
  createUser('parent', '1234', 'parent');
  createUser('kid', '5678', 'child', 'yoto', 'Kid');
  app = (await import('../server/app.js')).default;
  parentSession = await login('parent', '1234');
  childSession = await login('kid', '5678');
});

// better-sqlite3 aborts the worker if its statements are finalized during
// process teardown, so close the handle while the runtime is still up.
afterAll(() => {
  db?.close();
});

describe('auth', () => {
  it('rejects a wrong PIN and unauthenticated calls', async () => {
    const bad = await request(app)
      .post('/api/auth/login')
      .send({ username: 'parent', pin: '0000' });
    expect(bad.status).toBe(401);

    const anon = await request(app).get('/api/requests');
    expect(anon.status).toBe(401);

    const forged = await request(app)
      .get('/api/requests')
      .set('X-Session-Id', 'not-a-real-session');
    expect(forged.status).toBe(401);
  });

  it('returns the logged-in user and invalidates on logout', async () => {
    const sessionId = await login('kid', '5678');
    const me = await request(app).get('/api/auth/me').set('X-Session-Id', sessionId);
    expect(me.body).toMatchObject({ username: 'kid', role: 'child', profile: 'yoto' });

    await request(app).post('/api/auth/logout').set('X-Session-Id', sessionId);
    const after = await request(app).get('/api/auth/me').set('X-Session-Id', sessionId);
    expect(after.status).toBe(401);
  });

  it('authenticates from the session cookie without exposing the id to JS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'kid', pin: '5678' });
    expect(res.body.sessionId).toBeUndefined();
    const sessionCookie = (res.headers['set-cookie'] || []).find((c) =>
      c.startsWith('jj_session='),
    );
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);

    const cookies = (res.headers['set-cookie'] || [])
      .map((c) => c.split(';')[0])
      .join('; ');
    const me = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(me.body).toMatchObject({ username: 'kid' });

    const noCsrf = await request(app).post('/api/access-token').set('Cookie', cookies);
    expect(noCsrf.status).toBe(403);

    const withCsrf = await request(app)
      .post('/api/access-token')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', readCookie(res, 'jj_csrf'));
    expect(withCsrf.status).toBe(200);

    const forcedLogout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);
    expect(forcedLogout.status).toBe(403);
    const stillValid = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(stillValid.status).toBe(200);
  });
});

describe('role separation', () => {
  it('keeps parent-only routes away from children', async () => {
    for (const route of ['/api/requests/pending', '/api/analytics', '/api/blocked-keywords']) {
      const res = await request(app).get(route).set('X-Session-Id', childSession);
      expect(res.status, route).toBe(403);
    }
  });

  it('lets a child see only their own profile in the library', async () => {
    const res = await request(app).get('/api/requests').set('X-Session-Id', childSession);
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.profile === 'yoto')).toBe(true);
  });
});

describe('requests', () => {
  it('creates a pending request and cleans the title', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', childSession)
      .send({
        profile: 'yoto',
        title: 'Pharrell Williams - Happy (Official Music Video)',
        url: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs',
        type: 'music',
        searchQuery: 'happy',
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Pharrell Williams - Happy');
    expect(res.body.artist).toBe('Pharrell Williams');
    expect(res.body.status).toBe('pending');
  });

  it('rejects non-YouTube URLs', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', childSession)
      .send({
        profile: 'yoto',
        title: 'Sketchy',
        url: 'https://evil.example.com/video',
        type: 'music',
        searchQuery: 'sketchy',
      });
    expect(res.status).toBe(400);
  });

  it('blocks explicit versions for children but lets a parent opt in', async () => {
    const payload = {
      profile: 'yoto',
      title: 'Some Song (Explicit)',
      url: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs',
      type: 'music',
      searchQuery: 'some song',
    };

    const blocked = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', childSession)
      .send(payload);
    expect(blocked.status).toBe(400);
    expect(blocked.body.explicit).toBe(true);

    const childOverride = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', childSession)
      .send({ ...payload, allowExplicit: true });
    expect(childOverride.status).toBe(400);

    const parentOverride = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', parentSession)
      .send({ ...payload, allowExplicit: true });
    expect(parentOverride.status).toBe(200);
  });

  it('blocks keywords a parent added', async () => {
    await request(app)
      .post('/api/blocked-keywords')
      .set('X-Session-Id', parentSession)
      .send({ keyword: 'scary' });

    const res = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', childSession)
      .send({
        profile: 'yoto',
        title: 'A Scary Song',
        type: 'music',
        searchQuery: 'scary song',
      });
    expect(res.status).toBe(400);
    expect(res.body.violations).toContain('scary');
  });

  it('only lets a parent approve, and queues the download', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', childSession)
      .send({
        profile: 'yoto',
        title: 'Roar - Katy Perry',
        url: 'https://www.youtube.com/watch?v=CevxZvSJLk8',
        type: 'music',
        searchQuery: 'roar',
      });

    const denied = await request(app)
      .post(`/api/requests/${created.body.id}/approve`)
      .set('X-Session-Id', childSession);
    expect(denied.status).toBe(403);

    const approved = await request(app)
      .post(`/api/requests/${created.body.id}/approve`)
      .set('X-Session-Id', parentSession);
    expect(approved.status).toBe(200);

    const { downloadAndUpload } = await import('../server/downloader.js');
    expect(downloadAndUpload).toHaveBeenCalled();
  });

  it("won't let a child delete someone else's request", async () => {
    const parentRequest = await request(app)
      .post('/api/requests')
      .set('X-Session-Id', parentSession)
      .send({
        profile: 'ipod',
        title: 'Parent Track',
        type: 'music',
        searchQuery: 'parent track',
      });

    const res = await request(app)
      .delete(`/api/requests/${parentRequest.body.id}`)
      .set('X-Session-Id', childSession);
    expect(res.status).toBe(403);
  });
});

describe('file routes', () => {
  it('refuses path traversal and other profiles', async () => {
    const traversal = await request(app)
      .get('/api/downloads/yoto/..%2F..%2Fetc%2Fpasswd')
      .set('X-Session-Id', parentSession);
    expect([400, 404]).toContain(traversal.status);

    const otherProfile = await request(app)
      .get('/api/downloads/ipod/song.mp3')
      .set('X-Session-Id', childSession);
    expect(otherProfile.status).toBe(403);

    const badProfile = await request(app)
      .get('/api/downloads/hacker/song.mp3')
      .set('X-Session-Id', parentSession);
    expect(badProfile.status).toBe(400);
  });

  it('requires authentication to stream', async () => {
    const res = await request(app).get('/api/stream/yoto/song.mp3');
    expect(res.status).toBe(401);

    const badToken = await request(app).get(
      '/api/stream/yoto/song.mp3?token=nope',
    );
    expect(badToken.status).toBe(401);
  });

  it('streams a file with a signed access token and honours ranges', async () => {
    const dir = path.join(process.env.DOWNLOAD_DIR, 'yoto');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'token-song.mp3'), 'abcdefghij');

    const tokenRes = await request(app)
      .post('/api/access-token')
      .set('X-Session-Id', childSession);
    expect(tokenRes.status).toBe(200);
    const { token } = tokenRes.body;

    const full = await request(app).get(
      `/api/stream/yoto/token-song.mp3?token=${token}`,
    );
    expect(full.status).toBe(200);

    const ranged = await request(app)
      .get(`/api/stream/yoto/token-song.mp3?token=${token}`)
      .set('Range', 'bytes=0-3');
    expect(ranged.status).toBe(206);
    expect(ranged.headers['content-range']).toBe('bytes 0-3/10');

    // A child's token can't reach the other profile
    const otherProfile = await request(app).get(
      `/api/stream/ipod/token-song.mp3?token=${token}`,
    );
    expect(otherProfile.status).toBe(403);
  });
});

describe('events', () => {
  it('requires a valid token for the SSE stream', async () => {
    const anon = await request(app).get('/api/events');
    expect(anon.status).toBe(401);

    const forged = await request(app).get('/api/events?token=nope');
    expect(forged.status).toBe(401);
  });

  it('pushes request changes to a subscribed parent', async () => {
    const { token } = (
      await request(app).post('/api/access-token').set('X-Session-Id', parentSession)
    ).body;

    // Supertest buffers whole responses, so talk to a real socket instead
    const server = app.listen(0);
    const { port } = server.address();
    const res = await new Promise((resolve) => {
      const req = http.get(
        `http://127.0.0.1:${port}/api/events?token=${token}`,
        resolve,
      );
      req.on('error', () => {});
    });
    expect(res.statusCode).toBe(200);

    const received = new Promise((resolve, reject) => {
      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        if (buffer.includes('event: request')) resolve(buffer);
      });
      res.on('error', reject);
      setTimeout(() => reject(new Error('no event received')), 5000);
    });

    // Give the stream a tick to attach before publishing
    await new Promise((r) => setTimeout(r, 200));
    const { publishRequestChange } = await import('../server/requestEvents.js');
    publishRequestChange({
      type: 'updated',
      request: { id: 'sse-1', profile: 'yoto', title: 'SSE Song', status: 'completed' },
    });

    const frame = await received;
    expect(frame).toContain('SSE Song');

    res.destroy();
    await new Promise((r) => server.close(r));
  });
});

describe('profiles + thumbnails', () => {
  it('lists profiles publicly with only safe fields', async () => {
    const res = await request(app).get('/api/auth/profiles');
    expect(res.status).toBe(200);
    const names = res.body.map((p) => p.username);
    expect(names).toContain('parent');
    expect(names).toContain('kid');
    expect(res.body[0]).not.toHaveProperty('pin');
    expect(res.body[0]).not.toHaveProperty('id');
  });

  it('requires auth and validates the thumbnail URL', async () => {
    const anon = await request(app).get(
      '/api/thumb?u=https://img.youtube.com/vi/x/mqdefault.jpg',
    );
    expect(anon.status).toBe(401);

    const badHost = await request(app)
      .get('/api/thumb?u=https://evil.example.com/x.jpg')
      .set('X-Session-Id', childSession);
    expect(badHost.status).toBe(400);

    const plainHttp = await request(app)
      .get('/api/thumb?u=http://img.youtube.com/vi/x/mqdefault.jpg')
      .set('X-Session-Id', childSession);
    expect(plainHttp.status).toBe(400);
  });

  it('serves a cached thumbnail with long cache headers', async () => {
    const url = 'https://img.youtube.com/vi/test123/mqdefault.jpg';
    const key = createHash('sha256').update(url).digest('hex').slice(0, 32);
    const dir = path.join(process.env.DOWNLOAD_DIR, 'thumbs');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${key}.jpg`),
      Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    );

    const res = await request(app)
      .get(`/api/thumb?u=${encodeURIComponent(url)}`)
      .set('X-Session-Id', childSession);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });
});

describe('search', () => {
  it('filters explicit tracks out of results for a child', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'happy' })
      .set('X-Session-Id', childSession);
    expect(res.status).toBe(200);
    expect(res.body.every((r) => !r.isExplicit)).toBe(true);
  });
});

describe('user management', () => {
  it('is parent-only', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('X-Session-Id', childSession);
    expect(res.status).toBe(403);
  });

  it('creates a child, rotates its PIN, and invalidates its sessions', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('X-Session-Id', parentSession)
      .send({ username: 'rosie', pin: '4321', profile: 'ipod', displayName: 'Rosie' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ username: 'rosie', role: 'child', profile: 'ipod' });

    const session = await login('rosie', '4321');

    const rotated = await request(app)
      .post(`/api/users/${created.body.id}/pin`)
      .set('X-Session-Id', parentSession)
      .send({ pin: '9999' });
    expect(rotated.status).toBe(200);

    const stale = await request(app).get('/api/requests').set('X-Session-Id', session);
    expect(stale.status).toBe(401);

    const relogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'rosie', pin: '9999' });
    expect(relogin.status).toBe(200);
  });

  it('revokes already-issued access tokens when the PIN changes', async () => {
    const users = await request(app).get('/api/users').set('X-Session-Id', parentSession);
    const kid = users.body.find((u) => u.username === 'kid');

    const session = await login('kid', '5678');
    const token = (
      await request(app).post('/api/access-token').set('X-Session-Id', session)
    ).body.token;
    await request(app)
      .post(`/api/users/${kid.id}/pin`)
      .set('X-Session-Id', parentSession)
      .send({ pin: '5678' });

    const revoked = await request(app).get('/api/events').query({ token });
    expect(revoked.status).toBe(401);
  });

  it('rejects oversized display names', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('X-Session-Id', parentSession)
      .send({
        username: 'longname',
        pin: '1234',
        profile: 'yoto',
        displayName: 'x'.repeat(41),
      });
    expect(res.status).toBe(400);
  });

  it('validates usernames, PINs and duplicates', async () => {
    const badPin = await request(app)
      .post('/api/users')
      .set('X-Session-Id', parentSession)
      .send({ username: 'jo', pin: '12', profile: 'yoto' });
    expect(badPin.status).toBe(400);

    const badName = await request(app)
      .post('/api/users')
      .set('X-Session-Id', parentSession)
      .send({ username: 'Bad Name!', pin: '1111', profile: 'yoto' });
    expect(badName.status).toBe(400);

    const dupe = await request(app)
      .post('/api/users')
      .set('X-Session-Id', parentSession)
      .send({ username: 'kid', pin: '1111', profile: 'yoto' });
    expect(dupe.status).toBe(409);
  });

  it('refuses to delete a child that still has requests', async () => {
    const users = await request(app).get('/api/users').set('X-Session-Id', parentSession);
    const kid = users.body.find((u) => u.username === 'kid');
    expect(kid.request_count).toBeGreaterThan(0);

    const blocked = await request(app)
      .delete(`/api/users/${kid.id}`)
      .set('X-Session-Id', parentSession);
    expect(blocked.status).toBe(409);

    const rosie = users.body.find((u) => u.username === 'rosie');
    const removed = await request(app)
      .delete(`/api/users/${rosie.id}`)
      .set('X-Session-Id', parentSession);
    expect(removed.status).toBe(200);
  });
});
