import * as fs from 'fs';
import * as path from 'path';
import { getClient } from './getClient';

async function seedDatabase() {
  const client = await getClient();
  if (!client) return;
  try {
    console.log('Connecting to database...');
    await client.connect();
    const sqlScript = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    console.log('Executing SQL script...');
    await client.query(sqlScript);
    console.log('Tables seeded successfully');
  } catch (err) {
    console.error('Error:', err);
    throw err;
  } finally {
    await client.end();
  }
}

seedDatabase().catch(console.error);
