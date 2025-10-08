// Quick test to verify email templates have the correct content
import { verifyEmailTemplate, resetEmailTemplate } from './src/lib/emailTemplates.ts';

console.log('Testing Verification Email Template...\n');
const verifyEmail = verifyEmailTemplate('https://example.com/verify?code=123', 'Test User');
console.log('Subject:', verifyEmail.subject);
console.log('\nChecking for benefits in HTML...');
const hasBenefits = verifyEmail.html.includes('Send unlimited review requests') &&
                     verifyEmail.html.includes('Monitor feedback in real-time') &&
                     verifyEmail.html.includes('Generate branded QR codes') &&
                     verifyEmail.html.includes('Invite team members');
console.log('✅ Benefits found:', hasBenefits);

const hasSecurityNote = verifyEmail.html.includes('24 hours') && verifyEmail.html.includes('🔒');
console.log('✅ Security note found:', hasSecurityNote);

console.log('\n---\n');
console.log('Testing Password Reset Email Template...\n');
const resetEmail = resetEmailTemplate('https://example.com/reset?code=456', 'Test User');
console.log('Subject:', resetEmail.subject);
console.log('\nChecking for security note in HTML...');
const hasResetSecurity = resetEmail.html.includes('1 hour') && resetEmail.html.includes('🔒');
console.log('✅ Security note found:', hasResetSecurity);

const hasReturnLink = resetEmail.html.includes('Return to Login');
console.log('✅ Return to Login link found:', hasReturnLink);

if (hasBenefits && hasSecurityNote && hasResetSecurity && hasReturnLink) {
  console.log('\n✅ All email templates are correctly configured!');
} else {
  console.error('\n❌ Email templates are missing expected content!');
  process.exit(1);
}
