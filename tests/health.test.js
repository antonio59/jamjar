import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jamjar-health-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.DOWNLOAD_DIR = path.join(tmpDir, 'downloads');
process.env.BACKUP_DIR = path.join(tmpDir, 'backups');
process.env.BACKUP_KEEP = '2';

vi.mock('../server/downloader.js', () => ({
  downloadAndUpload: vi.fn(async () => {}),
}));

let app;
let db;

beforeAll(async () => {
  fs.mkdirSync(process.env.DOWNLOAD_DIR, { recursive: true });
  db = (await import('../server/database.js')).default;
  app = (await import('../server/app.js')).default;
});

afterAll(() => {
  db?.close();
});

describe('GET /api/health', () => {
  it('reports liveness without leaking internals', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      checks: { database: 'ok', downloads: 'ok' },
    });
    expect(res.body.version).toBeUndefined();
    expect(res.body.uptimeSeconds).toBeUndefined();
    expect(res.body.queue).toBeUndefined();
    expect(res.body.lastBackup).toBeUndefined();
  });

  it('degrades to 503 when the download directory is gone', async () => {
    fs.rmSync(process.env.DOWNLOAD_DIR, { recursive: true, force: true });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.downloads).toBe('error');
    fs.mkdirSync(process.env.DOWNLOAD_DIR, { recursive: true });
  });
});

describe('GET /api/health/details', () => {
  it('rejects anonymous and child callers', async () => {
    expect((await request(app).get('/api/health/details')).status).toBe(401);

    const { createUser } = await import('../server/database.js');
    createUser('healthkid', '5678', 'child', 'yoto');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'healthkid', pin: '5678' });
    const cookies = login.headers['set-cookie']
      .map((c) => c.split(';')[0])
      .join('; ');
    const res = await request(app)
      .get('/api/health/details')
      .set('Cookie', cookies);
    expect(res.status).toBe(403);
  });

  it('serves the full report to the parent', async () => {
    const { createUser } = await import('../server/database.js');
    createUser('healthparent', '1234', 'parent');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'healthparent', pin: '1234' });
    const cookies = login.headers['set-cookie']
      .map((c) => c.split(';')[0])
      .join('; ');
    const res = await request(app)
      .get('/api/health/details')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      checks: { database: 'ok', downloads: 'ok' },
      queue: { active: 0, pending: 0 },
    });
    expect(typeof res.body.version).toBe('string');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });
});

describe('backups', () => {
  it('writes a usable copy and keeps only BACKUP_KEEP of them', async () => {
    const { backupNow, lastBackup } = await import('../server/backup.js');

    const first = backupNow();
    expect(fs.existsSync(first)).toBe(true);
    expect(lastBackup().file).toBe(path.basename(first));

    // Stamps have millisecond resolution, so space the runs out
    await new Promise((r) => setTimeout(r, 5));
    backupNow();
    await new Promise((r) => setTimeout(r, 5));
    backupNow();

    const files = fs.readdirSync(process.env.BACKUP_DIR);
    expect(files).toHaveLength(2);
    expect(files).not.toContain(path.basename(first));
  });
});
