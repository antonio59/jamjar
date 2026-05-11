import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data/jamjar.db');
const db = new Database(DB_PATH);

function getAllUsers() {
  return db.prepare('SELECT id, username, role, profile, display_name FROM users ORDER BY role, username').all();
}

function setPin(username, pin) {
  const stmt = db.prepare('UPDATE users SET pin = ? WHERE username = ?');
  const result = stmt.run(pin, username);
  return result.changes > 0;
}

const args = process.argv.slice(2);

// Non-interactive mode: node set-pins.js <username> <pin>
if (args.length === 2) {
  const [username, pin] = args;
  if (!/^\d{4,8}$/.test(pin)) {
    console.error('PIN must be 4–8 digits.');
    process.exit(1);
  }
  if (setPin(username, pin)) {
    console.log(`✅ PIN updated for ${username}`);
  } else {
    console.error(`❌ User "${username}" not found.`);
    process.exit(1);
  }
  db.close();
  process.exit(0);
}

// Interactive mode
const users = getAllUsers();
if (users.length === 0) {
  console.error('No users found. Run: node seed.js first.');
  process.exit(1);
}

console.log('\n🔑 JamJar PIN Manager\n');
console.log('Current accounts:');
users.forEach(u => {
  const label = u.display_name || u.username;
  const role = u.role === 'parent' ? '👨‍👩‍👧‍👦 Parent' : `👶 Child (${u.profile})`;
  console.log(`  ${role}  — ${u.username} (${label})`);
});
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function run() {
  for (const user of users) {
    const label = user.display_name || user.username;
    const answer = await ask(`New PIN for ${label} (${user.username}) — press Enter to skip: `);
    const pin = answer.trim();
    if (pin === '') {
      console.log(`  ↩ Skipped`);
      continue;
    }
    if (!/^\d{4,8}$/.test(pin)) {
      console.log(`  ⚠️  Invalid PIN (must be 4–8 digits) — skipped`);
      continue;
    }
    setPin(user.username, pin);
    console.log(`  ✅ PIN updated`);
  }

  console.log('\n✅ Done. Restart the server for changes to take effect if using in-memory sessions.\n');
  rl.close();
  db.close();
}

run();
