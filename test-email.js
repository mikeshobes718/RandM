const { ServerClient } = require('postmark');

const postmark = new ServerClient('7001fe52-f8cc-4eec-b907-f81b36fdbfd0');

async function testEmail() {
  try {
    console.log('Sending test email...');
    const result = await postmark.sendEmail({
      From: 'Reviews & Marketing <subscriptions@reviewsandmarketing.com>',
      To: 'mikeshobes718@yahoo.com',
      Subject: 'Test Email - Verification',
      HtmlBody: '<h1>Test Email</h1><p>This is a test verification email.</p>',
      TextBody: 'Test Email\n\nThis is a test verification email.',
      MessageStream: 'outbound',
      TrackOpens: false,
      TrackLinks: 'None',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.MessageID);
    console.log('Submitted at:', result.SubmittedAt);
    console.log('To:', result.To);
  } catch (error) {
    console.error('❌ Email send failed:');
    console.error('Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Error Code:', error.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

testEmail();

