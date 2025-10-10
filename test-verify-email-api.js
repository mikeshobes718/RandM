// Test the email verification API
const https = require('https');

const hostname = 'reviewsandmarketing-njiwnafuw-mikes-projects-9cbe43e2.vercel.app';
const path = '/api/auth/email';

const postData = JSON.stringify({
  email: 'test@example.com',
  type: 'verify'
});

const options = {
  hostname: hostname,
  port: 443,
  path: path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log(`Testing ${hostname}${path}...`);
console.log('Payload:', postData);

const req = https.request(options, (res) => {
  console.log(`\nStatus Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log(data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Email API responded successfully');
    } else {
      console.log('\n❌ Email API returned error status');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:');
  console.error(error);
});

req.write(postData);
req.end();

