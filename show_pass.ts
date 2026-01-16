import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const pass = process.env.SUPABASE_DB_PASSWORD;
if (pass) {
  console.log('Pass start:', pass.substring(0, 3));
  console.log('Pass end:', pass.substring(pass.length - 3));
  console.log('Pass length:', pass.length);
} else {
  console.log('No pass found in .env.local');
}
