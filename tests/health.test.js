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
  it('reports liveness without authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      checks: { database: 'ok', downloads: 'ok' },
    });
    expect(res.body.queue).toMatchObject({ active: 0, pending: 0 });
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('degrades to 503 when the download directory is gone', async () => {
    fs.rmSync(process.env.DOWNLOAD_DIR, { recursive: true, force: true });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.downloads).toMatch(/not writable/);
    fs.mkdirSync(process.env.DOWNLOAD_DIR, { recursive: true });
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
