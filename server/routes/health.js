import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';
import { queueStatus } from '../downloadQueue.js';
import { lastBackup } from '../backup.js';
import { YTDLP_BIN, YTDLP_VERSION } from '../ytdlp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
);
const DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR || path.join(__dirname, '../../downloads');

function runChecks() {
  const checks = { database: 'ok', downloads: 'ok' };

  try {
    db.prepare('SELECT 1').get();
  } catch {
    checks.database = 'error';
  }

  try {
    fs.accessSync(DOWNLOAD_DIR, fs.constants.W_OK);
  } catch {
    checks.downloads = 'error';
  }

  return checks;
}

// Full report for the authenticated /api/health/details route in api.js.
export function healthDetails() {
  const checks = runChecks();
  const healthy = Object.values(checks).every((c) => c === 'ok');
  return {
    status: healthy ? 'ok' : 'degraded',
    version,
    uptimeSeconds: Math.round(process.uptime()),
    checks,
    queue: queueStatus(),
    lastBackup: lastBackup(),
    // Which yt-dlp resolved — a stale extractor is the usual reason every
    // download fails at once, so expose it on the parent-only report.
    ytdlp: { bin: YTDLP_BIN, version: YTDLP_VERSION },
  };
}

const router = express.Router();

// Unauthenticated so systemd/nginx/uptime checks can hit it — deliberately
// leaks nothing beyond "is it alive": no version, uptime, internals, or
// error strings that could help enumerate the deployment.
router.get('/health', (req, res) => {
  const checks = runChecks();
  const healthy = Object.values(checks).every((c) => c === 'ok');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks,
  });
});

export default router;
