import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';
import { queueStatus } from '../downloadQueue.js';
import { lastBackup } from '../backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
);
const DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR || path.join(__dirname, '../../downloads');

const router = express.Router();

// Unauthenticated so systemd/nginx/uptime checks can hit it; reports no data
// beyond liveness of the two things that break in production.
router.get('/health', (req, res) => {
  const checks = { database: 'ok', downloads: 'ok' };

  try {
    db.prepare('SELECT 1').get();
  } catch (err) {
    checks.database = `error: ${err.message}`;
  }

  try {
    fs.accessSync(DOWNLOAD_DIR, fs.constants.W_OK);
  } catch {
    checks.downloads = 'error: download directory not writable';
  }

  const healthy = Object.values(checks).every((c) => c === 'ok');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    version,
    uptimeSeconds: Math.round(process.uptime()),
    checks,
    queue: queueStatus(),
    lastBackup: lastBackup(),
  });
});

export default router;
