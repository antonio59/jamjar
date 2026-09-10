import fs from 'fs';
import path from 'path';
import db from './database.js';
import logger from './logger.js';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data/jamjar.db');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups');
const KEEP = Math.max(1, parseInt(process.env.BACKUP_KEEP || '7', 10) || 7);
const INTERVAL_MS = 24 * 60 * 60 * 1000;

// VACUUM INTO writes a consistent, compacted copy while the server keeps
// serving — safe with WAL, unlike copying the .db file.
export function backupNow() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BACKUP_DIR, `jamjar-${stamp}.db`);
  db.prepare('VACUUM INTO ?').run(target);
  const { size } = fs.statSync(target);
  pruneOldBackups();
  logger.info('database backup written', { target, bytes: size });
  return target;
}

export function pruneOldBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('jamjar-') && f.endsWith('.db'))
    .sort()
    .reverse();
  for (const stale of files.slice(KEEP)) {
    fs.unlinkSync(path.join(BACKUP_DIR, stale));
    logger.info('pruned old backup', { file: stale });
  }
}

export function lastBackup() {
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const [latest] = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('jamjar-') && f.endsWith('.db'))
    .sort()
    .reverse();
  if (!latest) return null;
  const { mtime, size } = fs.statSync(path.join(BACKUP_DIR, latest));
  return { file: latest, at: mtime.toISOString(), bytes: size };
}

// Runs a backup at startup and then daily; the timer is unref'd so it never
// keeps the process alive on its own.
export function startBackupSchedule() {
  const run = () => {
    try {
      backupNow();
    } catch (err) {
      logger.error('database backup failed', { error: err.message });
    }
  };
  run();
  return setInterval(run, INTERVAL_MS).unref();
}
