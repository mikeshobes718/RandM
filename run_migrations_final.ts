import { runSupabaseMigrations } from './src/lib/migrations';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('Running migrations locally...');
  try {
    const r = await runSupabaseMigrations();
    console.log('Migrations successful:', r.ran);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

main();

