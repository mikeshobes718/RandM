import { runSupabaseMigrations } from './src/lib/migrations';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function main() {
  console.log('Running migrations...');
  try {
    const result = await runSupabaseMigrations();
    console.log('Migrations complete:', result.ran);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
