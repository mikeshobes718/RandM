#!/usr/bin/env node
const https = require('https');

const FIREBASE_API_KEY = 'AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s';
const TEST_EMAIL = 'kewukimu83@mexvat.com';
const TEST_PASSWORD = 'T@st1234';
const BASE_URL = 'reviewsandmarketing.com';

function makeRequest(hostname, path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing live API with fresh deployment...\n');

  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginRes = await makeRequest('identitytoolkit.googleapis.com', `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
    });

    if (loginRes.status !== 200) {
      console.error('❌ Login failed');
      return;
    }

    const loginData = JSON.parse(loginRes.body);
    const idToken = loginData.idToken;
    console.log('✅ Login successful\n');

    // Step 2: Save business
    console.log('Step 2: Saving business data...');
    const businessData = {
      name: 'API Test Business ' + Date.now(),
      review_link: 'https://g.page/test',
      google_place_id: 'ChIJtest' + Date.now(),
      google_rating: 4.8,
      address: '123 Test St',
      idToken: idToken,
    };

    const saveRes = await makeRequest(BASE_URL, '/api/businesses/upsert/form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: businessData,
    });

    if (saveRes.status !== 200) {
      console.error('❌ Business save failed:', saveRes.status, saveRes.body);
      return;
    }

    const saveData = JSON.parse(saveRes.body);
    console.log('✅ Business saved successfully');
    console.log('\n📦 Response:', JSON.stringify(saveData, null, 2));

    if (!saveData.business) {
      console.error('\n❌ FAILED: Response does not include business data!');
      return;
    }

    console.log('\n✅ SUCCESS! Business data is now returned:', saveData.business.name);
    
    // Step 3: Verify dashboard can fetch it
    console.log('\nStep 3: Verifying dashboard can fetch business...');
    const dashRes = await makeRequest(BASE_URL, '/api/dashboard/summary', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (dashRes.status === 200) {
      const dashData = JSON.parse(dashRes.body);
      if (dashData.business) {
        console.log('✅ Dashboard sees business:', dashData.business.name);
      } else {
        console.log('⚠️  Dashboard doesn\'t see business yet (might need a moment)');
      }
    }

    console.log('\n🎉 FIX VERIFIED - The API now returns business data!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
