import { runSupabaseMigrations } from './src/lib/migrations';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Running migrations...');
  try {
    const result = await runSupabaseMigrations();
    console.log('Migrations ran successfully:', result.ran);
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

main();

