#!/usr/bin/env node

/**
 * Test Firebase Admin SDK initialization by calling the session endpoint
 */

import puppeteer from 'puppeteer';

const APP_URL = process.env.APP_URL || 'https://reviewsandmarketing.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'tugereyu58@ramcen.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'T@st1234';

async function testFirebaseAdmin() {
  console.log('🔥 Testing Firebase Admin SDK initialization...');
  console.log(`🌐 Base URL: ${APP_URL}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser error:', msg.text());
      }
    });
    
    // Test 1: Check Firebase debug endpoints
    console.log('\n📊 Testing Firebase debug endpoints...');
    
    try {
      const firebaseSimpleResponse = await page.goto(`${APP_URL}/api/debug/firebase-simple`);
      const firebaseSimpleText = await firebaseSimpleResponse.text();
      console.log('🔍 /api/debug/firebase-simple:', firebaseSimpleText);
      
      if (firebaseSimpleText.includes('"success":true')) {
        console.log('✅ Firebase service account is parsing correctly');
      } else {
        console.log('❌ Firebase service account parsing failed');
      }
    } catch (error) {
      console.log('❌ Failed to check Firebase debug endpoint:', error.message);
    }
    
    // Test 2: Try to get a Firebase ID token by logging in
    console.log('\n🔐 Testing Firebase client authentication...');
    
    await page.goto(`${APP_URL}/login`);
    console.log('📍 On login page');
    
    // Fill login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    
    console.log('📝 Filled login form');
    
    // Submit form and wait for Firebase authentication
    await page.click('button[type="submit"]');
    console.log('🚀 Submitted login form');
    
    // Wait for redirect or error
    await page.waitForFunction(
      () => window.location.pathname !== '/login',
      { timeout: 30000 }
    );
    
    const currentUrl = page.url();
    console.log(`✅ Redirected to: ${currentUrl}`);
    
    // Test 3: Try to get Firebase ID token from client
    console.log('\n🎫 Testing Firebase ID token retrieval...');
    
    const idToken = await page.evaluate(async () => {
      try {
        // Try to get current user and ID token
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
        
        return new Promise((resolve, reject) => {
          const auth = getAuth();
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
              try {
                const token = await user.getIdToken();
                resolve(token);
              } catch (error) {
                reject('Failed to get ID token: ' + error.message);
              }
            } else {
              reject('No authenticated user');
            }
          });
          
          // Timeout after 10 seconds
          setTimeout(() => {
            unsubscribe();
            reject('Timeout waiting for auth state');
          }, 10000);
        });
      } catch (error) {
        return 'Error: ' + error.message;
      }
    });
    
    if (typeof idToken === 'string' && idToken.startsWith('eyJ')) {
      console.log('✅ Got Firebase ID token:', idToken.substring(0, 50) + '...');
      
      // Test 4: Try to create session cookie
      console.log('\n🍪 Testing session cookie creation...');
      
      const sessionResponse = await page.evaluate(async (token) => {
        try {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken: token })
          });
          
          return {
            status: response.status,
            ok: response.ok,
            text: await response.text()
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      }, idToken);
      
      console.log('🔍 Session creation response:', sessionResponse);
      
      if (sessionResponse.ok) {
        console.log('✅ Session cookie created successfully');
        
        // Test 5: Check if /api/auth/me works now
        console.log('\n👤 Testing /api/auth/me with session cookie...');
        
        const meResponse = await page.evaluate(async () => {
          try {
            const response = await fetch('/api/auth/me');
            return {
              status: response.status,
              ok: response.ok,
              text: await response.text()
            };
          } catch (error) {
            return {
              error: error.message
            };
          }
        });
        
        console.log('🔍 /api/auth/me response:', meResponse);
        
        if (meResponse.ok) {
          console.log('✅ Authentication flow working correctly!');
        } else {
          console.log('❌ /api/auth/me still failing after session creation');
        }
      } else {
        console.log('❌ Session cookie creation failed');
      }
    } else {
      console.log('❌ Failed to get Firebase ID token:', idToken);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testFirebaseAdmin().catch(console.error);














