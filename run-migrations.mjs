import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { runSupabaseMigrations } from './src/lib/migrations.js';

async function main() {
  console.log('Running migrations...');
  try {
    const result = await runSupabaseMigrations();
    console.log('Migrations ran successfully:', result);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();

