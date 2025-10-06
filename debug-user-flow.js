#!/usr/bin/env node
const https = require('https');

const TEST_EMAIL = 'bibiyo2509@sicmg.com';
const TEST_PASSWORD = 'T@st1234';
const FIREBASE_API_KEY = 'AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s';

function makeRequest(hostname, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({ 
      hostname, 
      path, 
      method: options.method || 'GET', 
      headers: options.headers || {},
      servername: hostname 
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function test() {
  console.log('🔍 Debugging your specific user account...\n');
  
  try {
    // Step 1: Login
    console.log('Step 1: Logging in as bibiyo2509@sicmg.com...');
    const loginRes = await makeRequest('identitytoolkit.googleapis.com', `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true })
    });
    
    if (loginRes.status !== 200) {
      console.error('❌ Login failed:', loginRes.status, loginRes.body);
      return;
    }
    
    const loginData = JSON.parse(loginRes.body);
    const idToken = loginData.idToken;
    console.log('✅ Logged in successfully\n');
    
    // Step 2: Check current dashboard state
    console.log('Step 2: Checking current dashboard state...');
    const dashRes = await makeRequest('reviewsandmarketing.com', '/api/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    
    if (dashRes.status === 200) {
      const dashData = JSON.parse(dashRes.body);
      console.log('Dashboard API Response:');
      console.log('  - Has business:', dashData.business ? 'YES' : 'NO');
      if (dashData.business) {
        console.log('  - Business name:', dashData.business.name);
        console.log('  - Business ID:', dashData.business.id);
        console.log('\n⚠️  YOU ALREADY HAVE A BUSINESS SAVED!');
        console.log('   The form should NOT be showing.');
        console.log('   This means the dashboard is not reading the business from the API correctly.\n');
      } else {
        console.log('  - No business found in database\n');
      }
    } else {
      console.log('❌ Dashboard API failed:', dashRes.status, dashRes.body.substring(0, 200));
    }
    
    // Step 3: Try to save a new business
    console.log('Step 3: Testing business save...');
    const saveRes = await makeRequest('reviewsandmarketing.com', '/api/businesses/upsert/form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: { name: 'Test Business ' + Date.now(), idToken }
    });
    
    console.log('Save Response Status:', saveRes.status);
    
    if (saveRes.status === 200) {
      const saveData = JSON.parse(saveRes.body);
      console.log('Save Response:', JSON.stringify(saveData, null, 2));
      
      if (saveData.business) {
        console.log('\n✅ API returns business data correctly');
      } else {
        console.log('\n❌ API does NOT return business data');
      }
    } else {
      console.log('❌ Save failed:', saveRes.body.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
