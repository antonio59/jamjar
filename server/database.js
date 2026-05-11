import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/jamjar.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('parent', 'child')),
    profile TEXT CHECK(profile IN ('yoto', 'ipod')),
    display_name TEXT,
    avatar_emoji TEXT DEFAULT '👤',
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
    rejected_reason TEXT,
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
  
  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
  CREATE INDEX IF NOT EXISTS idx_requests_profile ON requests(profile);
  CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

// Helper functions
export function createUser(username, pin, role, profile = null, displayName = null, avatarEmoji = '👤') {
  const id = uuidv4();
  const hashedPin = bcrypt.hashSync(pin, 10);
  const stmt = db.prepare(
    'INSERT INTO users (id, username, pin, role, profile, display_name, avatar_emoji) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, username, hashedPin, role, profile, displayName, avatarEmoji);
  return { id, username, role, profile, display_name: displayName, avatar_emoji: avatarEmoji };
}

export function getUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

export function getUserById(id) {
  const stmt = db.prepare('SELECT id, username, role, profile, display_name, avatar_emoji, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

export function verifyPin(username, pin) {
  const user = getUserByUsername(username);
  if (!user) return null;
  if (!bcrypt.compareSync(pin, user.pin)) return null;
  return user;
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

export function rejectRequest(requestId, reason) {
  const stmt = db.prepare(
    `UPDATE requests SET status = 'rejected', rejected_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  stmt.run(reason, requestId);
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
  
  const rejectionReasons = db.prepare(
    "SELECT rejected_reason, COUNT(*) as count FROM requests WHERE status = 'rejected' AND rejected_reason IS NOT NULL GROUP BY rejected_reason ORDER BY count DESC"
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
    rejectionReasons,
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

// Session management (persistent, survives server restarts)
const SESSION_TTL_DAYS = 30;

export function createSession(sessionId, userId) {
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at)
     VALUES (?, ?, datetime('now', '+${SESSION_TTL_DAYS} days'))`
  );
  stmt.run(sessionId, userId);
}

export function getSession(sessionId) {
  const stmt = db.prepare(
    `SELECT s.session_id, u.id, u.username, u.role, u.profile, u.display_name, u.avatar_emoji
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.session_id = ? AND s.expires_at > datetime('now')`
  );
  return stmt.get(sessionId);
}

export function deleteSession(sessionId) {
  db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
}

// Purge expired sessions (call periodically)
export function purgeExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}

export default db;
