#!/usr/bin/env node

// Quick test to see what HTML our email templates generate
import { verifyEmailTemplate, resetEmailTemplate } from './src/lib/emailTemplates.ts';

console.log('=== VERIFICATION EMAIL HTML ===\n');
const verifyEmail = verifyEmailTemplate('https://example.com/verify?code=123', 'Test User');
console.log('Subject:', verifyEmail.subject);
console.log('\nHTML Length:', verifyEmail.html.length);
console.log('\nHTML Preview (first 2000 chars):');
console.log(verifyEmail.html.substring(0, 2000));
console.log('\n\n--- Searching for "Send unlimited" (first benefit) ---');
console.log('Found:', verifyEmail.html.includes('Send unlimited') ? 'YES ✅' : 'NO ❌');
console.log('\n--- Searching for "🔒 If you didn" (security note) ---');
console.log('Found:', verifyEmail.html.includes('🔒 If you didn') ? 'YES ✅' : 'NO ❌');

console.log('\n\n=== PASSWORD RESET EMAIL HTML ===\n');
const resetEmail = resetEmailTemplate('https://example.com/reset?code=456', 'Test User');
console.log('Subject:', resetEmail.subject);
console.log('\nHTML Length:', resetEmail.html.length);
console.log('\nHTML Preview (first 2000 chars):');
console.log(resetEmail.html.substring(0, 2000));
console.log('\n\n--- Searching for "Return to Login" (secondary CTA) ---');
console.log('Found:', resetEmail.html.includes('Return to Login') ? 'YES ✅' : 'NO ❌');
console.log('\n--- Searching for "🔒 If you didn" (security note) ---');
console.log('Found:', resetEmail.html.includes('🔒 If you didn') ? 'YES ✅' : 'NO ❌');
