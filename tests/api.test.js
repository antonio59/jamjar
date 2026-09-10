import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
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

async function login(username, pin) {
  const res = await request(app).post('/api/auth/login').send({ username, pin });
  expect(res.status).toBe(200);
  return res.body.sessionId;
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
