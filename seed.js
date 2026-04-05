import { createUser } from './server/database.js';

console.log('Seeding database...');

try {
  // Create default parent account
  createUser('parent', 'parent123', 'parent', null, 'Parent');
  console.log('Created parent account: username=parent, password=parent123');

  // Create default child accounts
  createUser('yoto-kid', 'yoto123', 'child', 'yoto', 'Yoto Kid');
  console.log('Created Yoto account: username=yoto-kid, password=yoto123');

  createUser('ipod-kid', 'ipod123', 'child', 'ipod', 'iPod Kid');
  console.log('Created iPod account: username=ipod-kid, password=ipod123');

  console.log('Database seeded successfully!');
} catch (error) {
  console.error('Seed error (accounts may already exist):', error.message);
}
