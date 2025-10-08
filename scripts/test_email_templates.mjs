#!/usr/bin/env node
/**
 * Test script to verify email templates are working in production
 * 
 * Usage:
 *   # Test verification email
 *   APP_URL=https://reviewsandmarketing.com node scripts/test_email_templates.mjs verify test@mailinator.com
 * 
 *   # Test password reset email
 *   APP_URL=https://reviewsandmarketing.com node scripts/test_email_templates.mjs reset test@mailinator.com
 * 
 *   # Test against localhost
 *   APP_URL=http://localhost:3000 node scripts/test_email_templates.mjs verify test@mailinator.com
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const [,, type, email] = process.argv;

if (!type || !email || !['verify', 'reset'].includes(type)) {
  console.error('❌ Usage: node scripts/test_email_templates.mjs <verify|reset> <email>');
  console.error('');
  console.error('Examples:');
  console.error('  APP_URL=https://reviewsandmarketing.com node scripts/test_email_templates.mjs verify test@mailinator.com');
  console.error('  APP_URL=https://reviewsandmarketing.com node scripts/test_email_templates.mjs reset test@mailinator.com');
  process.exit(1);
}

console.log('');
console.log('📧 Testing email template...');
console.log('');
console.log(`  Type:     ${type === 'verify' ? 'Email Verification' : 'Password Reset'}`);
console.log(`  Email:    ${email}`);
console.log(`  Endpoint: ${APP_URL}/api/auth/email`);
console.log('');

const endpoint = `${APP_URL}/api/auth/email`;

try {
  console.log('🚀 Sending request...');
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      type: type,
    }),
  });

  console.log(`   Status: ${response.status} ${response.statusText}`);
  console.log('');

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Request failed:');
    console.error('');
    console.error(errorText);
    console.error('');
    
    if (errorText.includes('POSTMARK_SERVER_TOKEN')) {
      console.error('💡 Hint: POSTMARK_SERVER_TOKEN environment variable is not set');
      console.error('   Run: ./scripts/verify_env_vercel.sh to see how to configure it');
    } else if (errorText.includes('EMAIL_FROM')) {
      console.error('💡 Hint: EMAIL_FROM environment variable is not set');
      console.error('   It should be: subscriptions@reviewsandmarketing.com');
    } else if (errorText.includes('user-not-found')) {
      console.log('⚠️  User not found (this is expected for test emails)');
      console.log('   The email should still be sent for security reasons');
    } else if (errorText.includes('Link generation failed')) {
      console.error('💡 Hint: Firebase service account may not be configured correctly');
      console.error('   Check FIREBASE_SERVICE_ACCOUNT_B64 environment variable');
    }
    
    process.exit(1);
  }

  const result = await response.json();
  
  console.log('✅ Email sent successfully!');
  console.log('');
  console.log(`   Message ID: ${result.id || 'N/A'}`);
  console.log('');
  
  if (email.includes('@mailinator.com')) {
    console.log('📬 Check your inbox at:');
    console.log(`   https://www.mailinator.com/v4/public/inboxes.jsp?to=${email.split('@')[0]}`);
  } else {
    console.log('📬 Check your email inbox');
  }
  console.log('');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ What to verify in the email:');
  console.log('');
  
  if (type === 'verify') {
    console.log('  ✓ Sender: subscriptions@reviewsandmarketing.com');
    console.log('  ✓ Subject: Verify your email — Welcome to Reviews & Marketing!');
    console.log('  ✓ Has gradient header with "⚡ Reviews & Marketing" branding');
    console.log('  ✓ Contains 4 benefit bullet points:');
    console.log('    • Send unlimited review requests');
    console.log('    • Monitor feedback in real-time');
    console.log('    • Generate branded QR codes');
    console.log('    • Invite team members to collaborate');
    console.log('  ✓ Contains "Confirm Email" button (purple gradient)');
    console.log('  ✓ Contains security note: "🔒 If you didn\'t create this account..."');
    console.log('  ✓ Has footer with support links');
  } else {
    console.log('  ✓ Sender: subscriptions@reviewsandmarketing.com');
    console.log('  ✓ Subject: Reset your password — Reviews & Marketing');
    console.log('  ✓ Has gradient header with "⚡ Reviews & Marketing" branding');
    console.log('  ✓ Contains "Reset Password" button (purple gradient)');
    console.log('  ✓ Contains "Return to Login" secondary link');
    console.log('  ✓ Contains security note: "🔒 If you didn\'t request this password reset..."');
    console.log('  ✓ Mentions 1 hour expiration time');
    console.log('  ✓ Has footer with support links');
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
} catch (error) {
  console.error('❌ Request failed:');
  console.error('');
  console.error(error.message);
  console.error('');
  
  if (error.cause) {
    console.error('Cause:', error.cause);
    console.error('');
  }
  
  if (error.message.includes('ECONNREFUSED')) {
    console.error('💡 Hint: Server is not running or endpoint is incorrect');
    console.error(`   Make sure ${APP_URL} is accessible`);
  } else if (error.message.includes('fetch')) {
    console.error('💡 Hint: Check that APP_URL is correct');
    console.error(`   Current: ${APP_URL}`);
  }
  
  process.exit(1);
}
