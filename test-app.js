const http = require('http');

// Test the application endpoints
const testEndpoints = [
  { path: '/', name: 'Home Page' },
  { path: '/pricing', name: 'Pricing Page' },
  { path: '/api/health', name: 'Health API' }
];

async function testEndpoint(hostname, port, path, name) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${name} (${path}) - Status: ${res.statusCode}`);
          resolve(true);
        } else {
          console.log(`❌ ${name} (${path}) - Status: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${name} (${path}) - Error: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ ${name} (${path}) - Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Reviews & Marketing Application...\n');
  
  const hostname = 'localhost';
  const port = 3000;
  
  let passed = 0;
  let total = testEndpoints.length;
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(hostname, port, endpoint.path, endpoint.name);
    if (result) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The application is working correctly.');
    console.log('\n🌐 You can now view your application at:');
    console.log('   • Home: http://localhost:3000');
    console.log('   • Pricing: http://localhost:3000/pricing');
    console.log('   • Dashboard: http://localhost:3000/dashboard');
  } else {
    console.log('⚠️  Some tests failed. Please check the application.');
  }
}

// Run the tests
runTests().catch(console.error);














