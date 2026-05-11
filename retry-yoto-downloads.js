/**
 * Resets all failed/completed Yoto requests and re-triggers downloads
 * via the running server API.
 *
 * Usage:  node retry-yoto-downloads.js <parent-session-id>
 *
 * Get your session ID from the browser:
 *   DevTools → Application → Local Storage → sessionId value
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadAndUpload } from './server/downloader.js';
import { updateRequestStatus } from './server/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || './data/jamjar.db';
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(__dirname, 'downloads/yoto');

if (!fs.existsSync(DB_PATH)) {
  console.error('Database not found at:', DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);

// Find all yoto requests that failed or completed (re-download everything)
const requests = db.prepare(`
  SELECT * FROM requests
  WHERE profile = 'yoto'
  AND type = 'music'
  AND status IN ('failed', 'completed', 'approved', 'downloading')
  ORDER BY created_at ASC
`).all();

if (requests.length === 0) {
  console.log('No Yoto requests to retry.');
  db.close();
  process.exit(0);
}

console.log(`Found ${requests.length} Yoto request(s) to retry:\n`);
requests.forEach(r => console.log(`  • ${r.title} [${r.status}]`));
console.log('');

// Delete old downloaded files for these requests to avoid stale files
requests.forEach(r => {
  const sanitizedName = r.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const oldFile = path.join(DOWNLOAD_DIR, `${sanitizedName}.mp3`);
  if (fs.existsSync(oldFile)) {
    fs.unlinkSync(oldFile);
    console.log(`Deleted old file: ${sanitizedName}.mp3`);
  }
});

// Reset all to 'approved' so downloader can pick them up
const reset = db.prepare(`UPDATE requests SET status = 'approved', error_message = NULL, internxt_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
requests.forEach(r => reset.run(r.id));
db.close();

console.log('\nStarting re-downloads...\n');

// Re-download sequentially to avoid hammering yt-dlp
for (const request of requests) {
  request.status = 'approved';
  console.log(`⬇️  Downloading: ${request.title}`);
  try {
    await downloadAndUpload(request);
    console.log(`✅ Done: ${request.title}\n`);
  } catch (err) {
    console.error(`❌ Failed: ${request.title} — ${err.message}\n`);
  }
}

console.log('All retries complete.');
