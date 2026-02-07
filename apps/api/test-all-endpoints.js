#!/usr/bin/env node

/**
 * Comprehensive test script for all Riot API endpoints
 * Tests all endpoints with the provided API key
 */

const axios = require('axios');

const API_KEY = 'RGAPI-cdb29c26-9ff2-404c-ab3a-8dbec3bdb046';
const REGION = 'na1';
const BASE_URL = `https://${REGION}.api.riotgames.com`;

// Test results
const results = {
  passed: [],
  failed: [],
};

// Helper to make API calls
async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
    });

    if (response.status === expectedStatus) {
      console.log(`   ✅ PASSED (Status: ${response.status})`);
      results.passed.push({ name, url, status: response.status });
      return true;
    } else {
      console.log(`   ❌ FAILED (Expected: ${expectedStatus}, Got: ${response.status})`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}`);
      results.failed.push({ name, url, expected: expectedStatus, got: response.status, error: response.data });
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.failed.push({ name, url, error: error.message });
    return false;
  }
}

// Test all endpoints
async function runTests() {
  console.log('='.repeat(60));
  console.log('🚀 Testing All Riot API Endpoints');
  console.log('='.repeat(60));
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`Region: ${REGION}`);

  // ============================================
  // 1. SUMMONER API (v4)
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('1. SUMMONER API (v4)');
  console.log('='.repeat(60));

  // Test with a known summoner name (using a popular streamer for testing)
  const testSummonerName = 'Doublelift';
  
  // Get summoner by name
  await testEndpoint(
    'Get Summoner by Name',
    `${BASE_URL}/lol/summoner/v4/summoners/by-name/${testSummonerName}?api_key=${API_KEY}`
  );

  // Wait a bit to avoid rate limits
  await new Promise(resolve => setTimeout(resolve, 1200));

  // ============================================
  // 2. LEAGUE API (v4)
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('2. LEAGUE API (v4)');
  console.log('='.repeat(60));

  // Get Challenger League
  await testEndpoint(
    'Get Challenger League',
    `${BASE_URL}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`
  );

  await new Promise(resolve => setTimeout(resolve, 1200));

  // Get Grandmaster League
  await testEndpoint(
    'Get Grandmaster League',
    `${BASE_URL}/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`
  );

  await new Promise(resolve => setTimeout(resolve, 1200));

  // Get Master League
  await testEndpoint(
    'Get Master League',
    `${BASE_URL}/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`
  );

  await new Promise(resolve => setTimeout(resolve, 1200));

  // ============================================
  // 3. MATCH API (v5)
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('3. MATCH API (v5)');
  console.log('='.repeat(60));

  // First, get a PUUID from challenger league
  try {
    const challengerResponse = await axios.get(
      `${BASE_URL}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`
    );
    
    if (challengerResponse.data && challengerResponse.data.entries && challengerResponse.data.entries.length > 0) {
      const firstPlayer = challengerResponse.data.entries[0];
      
      // Get summoner by ID to get PUUID
      await new Promise(resolve => setTimeout(resolve, 1200));
      const summonerResponse = await axios.get(
        `${BASE_URL}/lol/summoner/v4/summoners/${firstPlayer.summonerId}?api_key=${API_KEY}`
      );
      
      if (summonerResponse.data && summonerResponse.data.puuid) {
        const puuid = summonerResponse.data.puuid;
        
        // Get match list
        await new Promise(resolve => setTimeout(resolve, 1200));
        await testEndpoint(
          'Get Match List by PUUID',
          `${BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?api_key=${API_KEY}&count=5&queue=420&type=ranked`
        );

        // Get a match ID if available
        await new Promise(resolve => setTimeout(resolve, 1200));
        const matchListResponse = await axios.get(
          `${BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?api_key=${API_KEY}&count=1&queue=420&type=ranked`
        );

        if (matchListResponse.data && matchListResponse.data.length > 0) {
          const matchId = matchListResponse.data[0];
          
          // Note: Match v5 uses routing value, not region
          const routingRegion = 'americas'; // NA uses americas routing
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          await testEndpoint(
            'Get Match by Match ID',
            `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`
          );
        }
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Could not test match endpoints: ${error.message}`);
  }

  // ============================================
  // 4. SPECTATOR API (v4)
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('4. SPECTATOR API (v4)');
  console.log('='.repeat(60));

  // Get active game (might not have one, so 404 is acceptable)
  try {
    const summonerResponse = await axios.get(
      `${BASE_URL}/lol/summoner/v4/summoners/by-name/${testSummonerName}?api_key=${API_KEY}`
    );
    
    if (summonerResponse.data && summonerResponse.data.id) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const response = await axios.get(
        `${BASE_URL}/lol/spectator/v4/active-games/by-summoner/${summonerResponse.data.id}?api_key=${API_KEY}`,
        { validateStatus: () => true }
      );
      
      if (response.status === 200) {
        console.log(`   ✅ PASSED (Active game found)`);
        results.passed.push({ name: 'Get Active Game', status: 200 });
      } else if (response.status === 404) {
        console.log(`   ✅ PASSED (No active game - expected for testing)`);
        results.passed.push({ name: 'Get Active Game (No Game)', status: 404 });
      } else {
        console.log(`   ❌ FAILED (Status: ${response.status})`);
        results.failed.push({ name: 'Get Active Game', got: response.status });
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Could not test spectator endpoint: ${error.message}`);
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach((test, index) => {
      console.log(`\n${index + 1}. ${test.name}`);
      console.log(`   URL: ${test.url || 'N/A'}`);
      console.log(`   Error: ${test.error || JSON.stringify(test)}`);
    });
  }

  if (results.passed.length > 0) {
    console.log('\n✅ Passed Tests:');
    results.passed.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.name} (${test.status})`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with error code if any tests failed
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
