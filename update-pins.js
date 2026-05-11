import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/jamjar.db';

if (!fs.existsSync(DB_PATH)) {
  console.error('Database not found at:', DB_PATH);
  process.exit(1);
}

const NEW_PIN = process.argv[2];

if (!NEW_PIN) {
  console.error('Usage: node update-pins.js <new-pin>');
  console.error('Example: node update-pins.js 270654');
  process.exit(1);
}

const db = new Database(DB_PATH);
const stmt = db.prepare('UPDATE users SET pin = ?');
const result = stmt.run(NEW_PIN);

console.log(`✅ Updated ${result.changes} user(s) to PIN: ${NEW_PIN}`);

const users = db.prepare('SELECT username, role, display_name FROM users').all();
console.log('\nCurrent users:');
users.forEach(u => {
  console.log(`  ${u.display_name || u.username} (${u.role}): PIN = ${NEW_PIN}`);
});

db.close();
