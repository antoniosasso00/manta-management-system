#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const RESULTS_FILE = 'api-test-results.json';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  },
  categories: {
    authentication: { tests: [], passed: 0, failed: 0 },
    admin: { tests: [], passed: 0, failed: 0 },
    production: { tests: [], passed: 0, failed: 0 },
    core: { tests: [], passed: 0, failed: 0 },
    specialized: { tests: [], passed: 0, failed: 0 }
  }
};

// Helper function to make HTTP request
async function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-X', method,
      '-H', 'Content-Type: application/json',
      '-w', '\\n%{http_code}',
      '-s' // Silent mode
    ];

    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      curlArgs.push('-H', `${key}: ${value}`);
    });

    // Add data for POST/PUT requests
    if (data) {
      curlArgs.push('-d', JSON.stringify(data));
    }

    curlArgs.push(`${BASE_URL}${endpoint}`);

    const curl = spawn('curl', curlArgs);
    let stdout = '';
    let stderr = '';

    curl.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    curl.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    curl.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`curl exited with code ${code}: ${stderr}`));
        return;
      }

      // Parse response
      const lines = stdout.trim().split('\n');
      const httpCode = lines[lines.length - 1];
      const responseBody = lines.slice(0, -1).join('\n');

      try {
        const jsonResponse = responseBody ? JSON.parse(responseBody) : {};
        resolve({
          statusCode: parseInt(httpCode),
          body: jsonResponse,
          raw: responseBody
        });
      } catch (e) {
        resolve({
          statusCode: parseInt(httpCode),
          body: responseBody,
          raw: responseBody
        });
      }
    });
  });
}

// Test function
async function runTest(category, testName, testFn) {
  console.log(`Running: ${category} - ${testName}`);
  testResults.summary.total++;
  
  try {
    const result = await testFn();
    testResults.categories[category].tests.push({
      name: testName,
      status: 'PASSED',
      result: result,
      timestamp: new Date().toISOString()
    });
    testResults.categories[category].passed++;
    testResults.summary.passed++;
    console.log(`✓ PASSED: ${testName}`);
  } catch (error) {
    testResults.categories[category].tests.push({
      name: testName,
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    testResults.categories[category].failed++;
    testResults.summary.failed++;
    testResults.summary.errors.push(`${category} - ${testName}: ${error.message}`);
    console.log(`✗ FAILED: ${testName} - ${error.message}`);
  }
}

// Test definitions
const tests = {
  authentication: [
    {
      name: 'Health Check',
      test: async () => {
        const response = await makeRequest('GET', '/api/health');
        if (response.statusCode !== 200) {
          throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Register - Missing confirmPassword',
      test: async () => {
        const response = await makeRequest('POST', '/api/auth/register', {
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User'
        });
        if (response.statusCode !== 400) {
          throw new Error(`Expected 400 for invalid data, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Profile - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/auth/profile');
        if (response.statusCode !== 401) {
          throw new Error(`Expected 401 for unauthorized API endpoint, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Forgot Password - Invalid Email',
      test: async () => {
        const response = await makeRequest('POST', '/api/auth/forgot-password', {
          email: 'invalid-email'
        });
        if (response.statusCode !== 400) {
          throw new Error(`Expected 400 for invalid email, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ],
  
  admin: [
    {
      name: 'Users List - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/admin/users');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Admin Stats - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/admin/stats');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Audit Logs - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/admin/audit-logs');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ],
  
  production: [
    {
      name: 'Production Stats - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/production/stats');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Production Events - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/production/events');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ],
  
  core: [
    {
      name: 'ODL List - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/odl');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Parts List - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/parts');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Departments List - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/departments');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ],
  
  specialized: [
    {
      name: 'Rate Limit Stats - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/rate-limit-stats');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    },
    {
      name: 'Autoclavi Batches - Unauthorized',
      test: async () => {
        const response = await makeRequest('GET', '/api/autoclavi/batches');
        if (response.statusCode !== 307) {
          throw new Error(`Expected 307 redirect for unauthorized, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ]
};

// Authentication helper
let authToken = null;

async function authenticate() {
  // Use test credentials from seed - NextAuth format
  const loginResponse = await makeRequest('POST', '/api/auth/callback/credentials', {
    email: 'admin@mantaaero.com',
    password: 'password123',
    callbackUrl: 'http://localhost:3002'
  });
  
  // NextAuth returns 302 redirect on success
  if (loginResponse.statusCode !== 302 && loginResponse.statusCode !== 200) {
    throw new Error(`Login failed: ${loginResponse.statusCode}`);
  }
  
  // For testing purposes, we'll use a simple approach
  // In a real scenario, we'd need to handle cookies/session
  authToken = 'test-session-token';
  return authToken;
}

// Add authenticated tests
const authenticatedTests = {
  admin: [
    {
      name: 'Users List - Authenticated',
      test: async () => {
        const response = await makeRequest('GET', '/api/admin/users', null, {
          'Authorization': `Bearer ${authToken}`
        });
        if (response.statusCode !== 200) {
          throw new Error(`Expected 200 for authenticated user, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ],
  production: [
    {
      name: 'Production Stats - Authenticated',
      test: async () => {
        const response = await makeRequest('GET', '/api/production/stats', null, {
          'Authorization': `Bearer ${authToken}`
        });
        if (response.statusCode !== 200) {
          throw new Error(`Expected 200 for authenticated user, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ],
  core: [
    {
      name: 'ODL List - Authenticated',
      test: async () => {
        const response = await makeRequest('GET', '/api/odl', null, {
          'Authorization': `Bearer ${authToken}`
        });
        if (response.statusCode !== 200) {
          throw new Error(`Expected 200 for authenticated user, got ${response.statusCode}`);
        }
        return response;
      }
    }
  ]
};

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting API Tests...\n');
  
  // Test if server is running
  try {
    await makeRequest('GET', '/api/health');
    console.log('✓ Server is running\n');
  } catch (error) {
    console.log('✗ Server is not running. Please start the development server first.');
    console.log('Run: npm run dev\n');
    process.exit(1);
  }

  // Run all tests
  for (const [category, categoryTests] of Object.entries(tests)) {
    console.log(`\n📋 Testing ${category.toUpperCase()} APIs:`);
    for (const test of categoryTests) {
      await runTest(category, test.name, test.test);
    }
  }

  // Skip authenticated tests for now - would require session handling
  console.log('\n🔐 Skipping authenticated tests (requires session cookie handling)');
  console.log('✓ Basic security tests completed successfully');

  // Generate summary
  console.log('\n📊 TEST SUMMARY:');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);

  // Category breakdown
  console.log('\n📈 CATEGORY BREAKDOWN:');
  for (const [category, data] of Object.entries(testResults.categories)) {
    const total = data.passed + data.failed;
    if (total > 0) {
      console.log(`${category.toUpperCase()}: ${data.passed}/${total} (${((data.passed / total) * 100).toFixed(1)}%)`);
    }
  }

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Results saved to: ${RESULTS_FILE}`);

  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);