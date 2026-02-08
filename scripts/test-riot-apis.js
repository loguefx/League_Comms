#!/usr/bin/env node

/**
 * Test script to verify Riot API endpoints are working correctly
 * This helps diagnose issues with API key, region routing, etc.
 * 
 * Usage: node scripts/test-riot-apis.js
 * 
 * Make sure RIOT_API_KEY is set in apps/api/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'api', '.env') });
const axios = require('axios');

const API_KEY = process.env.RIOT_API_KEY;
const REGION = 'na1'; // Test with NA region
const ROUTING_REGION = 'americas'; // Match-V5 uses routing regions

if (!API_KEY) {
  console.error('❌ ERROR: RIOT_API_KEY not found in apps/api/.env');
  console.error('   Please add: RIOT_API_KEY=your-api-key-here');
  process.exit(1);
}

console.log(`✅ API Key loaded: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

async function testEndpoint(name, url) {
  try {
    console.log(`Testing: ${name}`);
    console.log(`  URL: ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    const start = Date.now();
    const response = await axios.get(url, { timeout: 10000 });
    const duration = Date.now() - start;
    console.log(`  ✅ Success (${response.status}) - ${duration}ms`);
    if (response.data && Array.isArray(response.data)) {
      console.log(`  📊 Returned ${response.data.length} items`);
    } else if (response.data && typeof response.data === 'object') {
      const keys = Object.keys(response.data);
      console.log(`  📊 Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
    }
    console.log('');
    return { success: true, data: response.data };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`  ❌ Failed (${duration}ms)`);
    if (error.response) {
      console.log(`  Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`  Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log(`  Error: No response received (network/timeout)`);
    } else {
      console.log(`  Error: ${error.message}`);
    }
    console.log('');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Riot API Endpoints\n');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Get League Entries (League-V4)
  const leagueResult = await testEndpoint(
    'League-V4: Get Emerald I players',
    `https://${REGION}.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/EMERALD/I?page=1&api_key=${API_KEY}`
  );

  if (!leagueResult.success || !leagueResult.data || leagueResult.data.length === 0) {
    console.error('❌ Cannot proceed - need league entries to test other endpoints');
    return;
  }

  const firstPlayer = leagueResult.data[0];
  const summonerId = firstPlayer.summonerId;
  const summonerName = firstPlayer.summonerName;
  console.log(`📌 Using test player: ${summonerName} (${summonerId.substring(0, 10)}...)\n`);

  // Test 2: Get Summoner by ID (Summoner-V4)
  const summonerResult = await testEndpoint(
    'Summoner-V4: Get summoner by ID',
    `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}?api_key=${API_KEY}`
  );

  if (!summonerResult.success || !summonerResult.data) {
    console.error('❌ Cannot proceed - need summoner PUUID to test Match API');
    return;
  }

  const puuid = summonerResult.data.puuid;
  console.log(`📌 PUUID: ${puuid.substring(0, 10)}...\n`);

  // Test 3: Get Match List (Match-V5) - using routing region
  const matchListResult = await testEndpoint(
    'Match-V5: Get match list by PUUID (using routing region)',
    `https://${ROUTING_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&type=ranked&count=5&api_key=${API_KEY}`
  );

  if (!matchListResult.success || !matchListResult.data || matchListResult.data.length === 0) {
    console.error('❌ Cannot proceed - need match IDs to test Match details');
    return;
  }

  const matchId = matchListResult.data[0];
  console.log(`📌 Using match ID: ${matchId}\n`);

  // Test 4: Get Match Details (Match-V5) - using routing region
  await testEndpoint(
    'Match-V5: Get match details (using routing region)',
    `https://${ROUTING_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`
  );

  // Test 5: Try Match-V5 with specific region (should fail or work depending on Riot's setup)
  console.log('⚠️  Testing Match-V5 with specific region (na1) - this might fail:');
  await testEndpoint(
    'Match-V5: Get match details (using specific region - may fail)',
    `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`
  );

  console.log('='.repeat(60));
  console.log('\n✅ All critical tests completed!');
  console.log('\n📝 Summary:');
  console.log('  - If Match-V5 works with routing region (americas) but not with na1,');
  console.log('    then we need to use routing regions (which we just fixed!)');
  console.log('  - If all tests pass, the API key and endpoints are working correctly');
}

runTests().catch(console.error);
