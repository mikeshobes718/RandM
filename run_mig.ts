import { runSupabaseMigrations } from './src/lib/migrations';

async function run() {
  try {
    console.log('Running migrations...');
    const result = await runSupabaseMigrations();
    console.log('Migrations ran:', result.ran);
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
