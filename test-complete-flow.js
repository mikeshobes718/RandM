#!/usr/bin/env node
/**
 * Test the complete user flow:
 * 1. Login with existing user
 * 2. Get session token
 * 3. Save business data
 * 4. Verify business data is returned
 * 5. Check dashboard can fetch the data
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://reviewsandmarketing.com';
const TEST_EMAIL = 'kewukimu83@mexvat.com';
const TEST_PASSWORD = 'T@st1234';

// Helper to make requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || [],
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing complete user flow...\n');

  try {
    // Step 1: Get Firebase Web API Key
    console.log('Step 1: Getting Firebase config...');
    const FIREBASE_API_KEY = 'AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s'; // From firebaseClient.ts
    console.log('✅ Firebase API Key obtained\n');

    // Step 2: Login with Firebase
    console.log('Step 2: Logging in with Firebase...');
    const loginRes = await makeRequest(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          returnSecureToken: true,
        }),
      }
    );

    if (loginRes.status !== 200) {
      console.error('❌ Login failed:', loginRes.body);
      return;
    }

    const loginData = JSON.parse(loginRes.body);
    const idToken = loginData.idToken;
    console.log('✅ Login successful, got idToken:', idToken.substring(0, 20) + '...\n');

    // Step 3: Create session cookie
    console.log('Step 3: Creating session cookie...');
    const sessionRes = await makeRequest(`${BASE_URL}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken, days: 7 }),
    });

    const sessionCookie = sessionRes.cookies.find(c => c.startsWith('idToken='));
    console.log('✅ Session created:', sessionCookie ? 'Cookie set' : 'No cookie (will use token)', '\n');

    // Step 4: Save business data
    console.log('Step 4: Saving business data...');
    const businessData = {
      name: 'Test Business ' + Date.now(),
      review_link: 'https://g.page/test',
      google_place_id: 'ChIJtest123',
      google_rating: 4.5,
      address: '123 Test St, Test City',
      idToken: idToken,
    };

    const saveRes = await makeRequest(`${BASE_URL}/api/businesses/upsert/form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'Cookie': sessionCookie || '',
      },
      body: businessData,
    });

    if (saveRes.status !== 200) {
      console.error('❌ Business save failed:', saveRes.status, saveRes.body);
      return;
    }

    const saveData = JSON.parse(saveRes.body);
    console.log('✅ Business saved successfully');
    console.log('   Response:', JSON.stringify(saveData, null, 2));
    
    if (!saveData.business) {
      console.error('❌ PROBLEM: Response does not include business data!');
      return;
    }
    console.log('✅ Business data is included in response\n');

    // Step 5: Verify dashboard can fetch the data
    console.log('Step 5: Fetching dashboard data...');
    const dashRes = await makeRequest(`${BASE_URL}/api/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie || '',
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (dashRes.status !== 200) {
      console.error('❌ Dashboard fetch failed:', dashRes.status, dashRes.body);
      return;
    }

    const dashData = JSON.parse(dashRes.body);
    console.log('✅ Dashboard data fetched successfully');
    console.log('   Business:', dashData.business ? dashData.business.name : 'NULL');
    
    if (!dashData.business) {
      console.error('❌ PROBLEM: Dashboard cannot see the business!');
      return;
    }

    console.log('\n✅✅✅ ALL TESTS PASSED! ✅✅✅');
    console.log('\nSummary:');
    console.log('- Login: ✅');
    console.log('- Session: ✅');
    console.log('- Business Save: ✅');
    console.log('- Business Returned: ✅');
    console.log('- Dashboard Fetch: ✅');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

test();
