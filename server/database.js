import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/music-request.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('parent', 'child')),
    profile TEXT CHECK(profile IN ('yoto', 'ipod')),
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    profile TEXT NOT NULL CHECK(profile IN ('yoto', 'ipod')),
    title TEXT NOT NULL,
    url TEXT,
    type TEXT NOT NULL CHECK(type IN ('music', 'audiobook')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'downloading', 'completed', 'failed')),
    search_query TEXT NOT NULL,
    thumbnail TEXT,
    duration TEXT,
    approved_by TEXT,
    approved_at DATETIME,
    downloaded_at DATETIME,
    internxt_url TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS blocked_keywords (
    id TEXT PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    added_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id)
  );
  
  CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
  CREATE INDEX IF NOT EXISTS idx_requests_profile ON requests(profile);
  CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
`);

// Helper functions
export function createUser(username, password, role, profile = null, displayName = null) {
  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(
    'INSERT INTO users (id, username, password_hash, role, profile, display_name) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, username, passwordHash, role, profile, displayName);
  return { id, username, role, profile, display_name: displayName };
}

export function getUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

export function getUserById(id) {
  const stmt = db.prepare('SELECT id, username, role, profile, display_name, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// Request functions
export function createRequest(userId, profile, title, url, type, searchQuery, thumbnail, duration) {
  const id = uuidv4();
  const stmt = db.prepare(
    `INSERT INTO requests (id, user_id, profile, title, url, type, status, search_query, thumbnail, duration)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  );
  stmt.run(id, userId, profile, title, url, type, searchQuery, thumbnail, duration);
  return getRequestById(id);
}

export function getRequestById(id) {
  const stmt = db.prepare('SELECT * FROM requests WHERE id = ?');
  return stmt.get(id);
}

export function getAllRequests() {
  const stmt = db.prepare('SELECT * FROM requests ORDER BY created_at DESC');
  return stmt.all();
}

export function getPendingRequests() {
  const stmt = db.prepare("SELECT * FROM requests WHERE status = 'pending' ORDER BY created_at DESC");
  return stmt.all();
}

export function getRequestsByProfile(profile) {
  const stmt = db.prepare('SELECT * FROM requests WHERE profile = ? ORDER BY created_at DESC');
  return stmt.all(profile);
}

export function approveRequest(requestId, approvedBy) {
  const stmt = db.prepare(
    `UPDATE requests SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  stmt.run(approvedBy, requestId);
  return getRequestById(requestId);
}

export function rejectRequest(requestId) {
  const stmt = db.prepare(
    `UPDATE requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  stmt.run(requestId);
  return getRequestById(requestId);
}

export function updateRequestStatus(requestId, status, errorMessage = null, internxtUrl = null) {
  const stmt = db.prepare(
    `UPDATE requests SET status = ?, error_message = ?, internxt_url = ?, 
     downloaded_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE downloaded_at END,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  stmt.run(status, errorMessage, internxtUrl, status, requestId);
  return getRequestById(requestId);
}

export function deleteRequest(requestId) {
  const stmt = db.prepare('DELETE FROM requests WHERE id = ?');
  stmt.run(requestId);
}

// Analytics functions
export function getAnalytics() {
  const totalRequests = db.prepare('SELECT COUNT(*) as count FROM requests').get().count;
  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'pending'").get().count;
  const approvedCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'approved'").get().count;
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'completed'").get().count;
  const rejectedCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'rejected'").get().count;
  const failedCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'failed'").get().count;
  
  const yotoCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE profile = 'yoto'").get().count;
  const ipodCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE profile = 'ipod'").get().count;
  
  const musicCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE type = 'music'").get().count;
  const audiobookCount = db.prepare("SELECT COUNT(*) as count FROM requests WHERE type = 'audiobook'").get().count;
  
  const topRequests = db.prepare(
    'SELECT title, COUNT(*) as times_requested FROM requests GROUP BY title ORDER BY times_requested DESC LIMIT 10'
  ).all();
  
  const recentRequests = db.prepare(
    'SELECT * FROM requests ORDER BY created_at DESC LIMIT 20'
  ).all();
  
  return {
    total: totalRequests,
    pending: pendingCount,
    approved: approvedCount,
    completed: completedCount,
    rejected: rejectedCount,
    failed: failedCount,
    byProfile: { yoto: yotoCount, ipod: ipodCount },
    byType: { music: musicCount, audiobook: audiobookCount },
    topRequested: topRequests,
    recent: recentRequests,
  };
}

// Blocked keywords
export function getBlockedKeywords() {
  const stmt = db.prepare('SELECT * FROM blocked_keywords ORDER BY created_at DESC');
  return stmt.all();
}

export function addBlockedKeyword(keyword, addedBy) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO blocked_keywords (id, keyword, added_by) VALUES (?, ?, ?)');
  stmt.run(id, keyword.toLowerCase(), addedBy);
}

export function removeBlockedKeyword(id) {
  const stmt = db.prepare('DELETE FROM blocked_keywords WHERE id = ?');
  stmt.run(id);
}

export default db;
