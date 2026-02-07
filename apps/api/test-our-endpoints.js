#!/usr/bin/env node

/**
 * Test our application endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000';

async function testEndpoint(name, method, url, data = null) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method.toUpperCase()} ${url}`);
    
    const config = {
      method: method.toLowerCase(),
      url: `${API_BASE}${url}`,
      timeout: 10000,
      validateStatus: () => true,
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ PASSED (Status: ${response.status})`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
      }
      return { success: true, status: response.status, data: response.data };
    } else {
      console.log(`   ❌ FAILED (Status: ${response.status})`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 300)}`);
      return { success: false, status: response.status, error: response.data };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🚀 Testing Our Application Endpoints');
  console.log('='.repeat(60));

  const results = {
    passed: [],
    failed: [],
  };

  // Test health endpoint
  const health = await testEndpoint('Health Check', 'GET', '/health');
  if (health.success) results.passed.push('Health Check');
  else results.failed.push('Health Check');

  // Test champions diagnostics
  const diagnostics = await testEndpoint('Champions Diagnostics', 'GET', '/champions/diagnostics');
  if (diagnostics.success) results.passed.push('Champions Diagnostics');
  else results.failed.push('Champions Diagnostics');

  // Test champions endpoint (should work even with empty data)
  const champions = await testEndpoint('Get Champions Stats', 'GET', '/champions?rank=PLATINUM_PLUS');
  if (champions.success) results.passed.push('Get Champions Stats');
  else results.failed.push('Get Champions Stats');

  // Test champions with filters
  const championsFiltered = await testEndpoint('Get Champions Stats (Filtered)', 'GET', '/champions?rank=CHALLENGER&role=TOP&patch=latest');
  if (championsFiltered.success) results.passed.push('Get Champions Stats (Filtered)');
  else results.failed.push('Get Champions Stats (Filtered)');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.passed.length > 0) {
    console.log('\n✅ Passed:');
    results.passed.forEach(test => console.log(`   - ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(test => console.log(`   - ${test}`));
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
