import 'dotenv/config';
import { createUser } from './server/database.js';

const parentPin = process.env.PARENT_PIN;
const cristinaPin = process.env.CRISTINA_PIN;
const isabellaPin = process.env.ISABELLA_PIN;

if (!parentPin || !cristinaPin || !isabellaPin) {
  console.error('Error: PARENT_PIN, CRISTINA_PIN and ISABELLA_PIN must be set in .env');
  process.exit(1);
}

console.log('Seeding database...');

try {
  createUser('parent', parentPin, 'parent', null, 'Parent', '👨‍👩‍👧‍👦');
  console.log('✅ Parent account created');

  createUser('cristina', cristinaPin, 'child', 'yoto', 'Cristina', '👧');
  console.log('✅ Cristina (Yoto) account created');

  createUser('isabella', isabellaPin, 'child', 'ipod', 'Isabella', '👩');
  console.log('✅ Isabella (iPod) account created');

  console.log('\n🎉 Database seeded successfully!');
} catch (error) {
  console.error('Seed error (accounts may already exist):', error.message);
}
