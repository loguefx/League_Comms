#!/usr/bin/env node

/**
 * Comprehensive test using League API (which works) to test other endpoints
 */

const axios = require('axios');

const API_KEY = 'RGAPI-cdb29c26-9ff2-404c-ab3a-8dbec3bdb046';
const REGION = 'na1';
const BASE_URL = `https://${REGION}.api.riotgames.com`;

const results = {
  passed: [],
  failed: [],
  skipped: [],
};

async function testEndpoint(name, url, expectedStatus = 200, isOptional = false) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${url.substring(0, 100)}...`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status === expectedStatus) {
      console.log(`   ✅ PASSED (Status: ${response.status})`);
      results.passed.push(name);
      return { success: true, data: response.data };
    } else if (isOptional && response.status === 404) {
      console.log(`   ⚠️  SKIPPED (No data available - Status: ${response.status})`);
      results.skipped.push(name);
      return { success: true, skipped: true };
    } else {
      console.log(`   ❌ FAILED (Expected: ${expectedStatus}, Got: ${response.status})`);
      if (response.data) {
        console.log(`   Error: ${JSON.stringify(response.data).substring(0, 150)}`);
      }
      results.failed.push({ name, status: response.status, error: response.data });
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.failed.push({ name, error: error.message });
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('🚀 Comprehensive Riot API Endpoint Testing');
  console.log('='.repeat(70));
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`Region: ${REGION}`);

  // Step 1: Get Challenger League (we know this works)
  console.log('\n' + '='.repeat(70));
  console.log('STEP 1: Get Challenger League (Entry Point)');
  console.log('='.repeat(70));

  const challengerUrl = `${BASE_URL}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`;
  const challengerResult = await testEndpoint('Get Challenger League', challengerUrl);
  
  if (!challengerResult.success || !challengerResult.data) {
    console.log('\n❌ Cannot proceed - Challenger League API failed!');
    return;
  }

  const challengerEntries = challengerResult.data.entries || [];
  console.log(`   Found ${challengerEntries.length} challenger players`);

  if (challengerEntries.length === 0) {
    console.log('\n❌ No challenger players found!');
    return;
  }

  // Get first player's PUUID (challenger entries have PUUID directly)
  const firstPlayer = challengerEntries[0];
  const puuid = firstPlayer?.puuid;
  if (!puuid) {
    console.log('\n❌ No PUUID found in challenger entry!');
    return;
  }
  console.log(`   Using player PUUID: ${puuid.substring(0, 30)}...`);
  
  // We need summonerId for some APIs, so get it from PUUID
  let summonerId = null;

  // Step 2: Test Summoner API with PUUID
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  console.log('\n' + '='.repeat(70));
  console.log('STEP 2: Summoner API (v4)');
  console.log('='.repeat(70));

  const summonerByPuuidUrl = `${BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${API_KEY}`;
  const summonerResult = await testEndpoint('Get Summoner by PUUID', summonerByPuuidUrl);
  
  if (summonerResult.success && summonerResult.data) {
    summonerId = summonerResult.data.id;
    console.log(`   Got Summoner ID: ${summonerId ? summonerId.substring(0, 20) + '...' : 'N/A'}`);
    console.log(`   Summoner Name: ${summonerResult.data.name || 'N/A'}`);
    console.log(`   Summoner Level: ${summonerResult.data.summonerLevel || 'N/A'}`);

    // Step 3: Test League Entries for this summoner
    if (summonerId) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const leagueEntriesUrl = `${BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${API_KEY}`;
      const leagueEntriesResult = await testEndpoint('Get League Entries by Summoner ID', leagueEntriesUrl);
      if (!leagueEntriesResult.success) {
        console.log('   ⚠️  Note: League Entries endpoint may require additional permissions');
      }
    }
  }

  // Step 4: Test Match API with PUUID (we already have it from challenger league)
  if (puuid) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    console.log('\n' + '='.repeat(70));
    console.log('STEP 3: Match API (v5)');
    console.log('='.repeat(70));

    // Match v5 uses routing regions, not platform regions
    const routingRegion = 'americas'; // NA uses americas
    
    const matchListUrl = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?api_key=${API_KEY}&count=5&queue=420&type=ranked`;
    const matchListResult = await testEndpoint('Get Match List by PUUID', matchListUrl);

    if (matchListResult.success && matchListResult.data && matchListResult.data.length > 0) {
      const matchId = matchListResult.data[0];
      console.log(`   Found match: ${matchId}`);
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      const matchUrl = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`;
      await testEndpoint('Get Match by Match ID', matchUrl);
    }
  }

  // Step 5: Test Spectator API
  if (summonerId) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: Spectator API (v4)');
    console.log('='.repeat(70));

    const spectatorUrl = `${BASE_URL}/lol/spectator/v4/active-games/by-summoner/${summonerId}?api_key=${API_KEY}`;
    await testEndpoint('Get Active Game', spectatorUrl, 200, true); // 404 is OK if not in game
  }

  // Step 6: Test Grandmaster and Master Leagues
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  console.log('\n' + '='.repeat(70));
  console.log('STEP 5: Additional League APIs');
  console.log('='.repeat(70));

  await testEndpoint('Get Grandmaster League', `${BASE_URL}/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`);
  await new Promise(resolve => setTimeout(resolve, 1200));
  await testEndpoint('Get Master League', `${BASE_URL}/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);
  
  if (results.passed.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    results.passed.forEach((test, i) => console.log(`   ${i + 1}. ${test}`));
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⚠️  SKIPPED TESTS (No data available):');
    results.skipped.forEach((test, i) => console.log(`   ${i + 1}. ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach((test, i) => {
      console.log(`\n   ${i + 1}. ${test.name || test}`);
      if (test.status) console.log(`      Status: ${test.status}`);
      if (test.error) console.log(`      Error: ${JSON.stringify(test.error).substring(0, 100)}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  
  // Determine overall success
  const hasCriticalFailures = results.failed.some(f => 
    typeof f === 'object' && f.name && !f.name.includes('Active Game')
  );
  
  if (hasCriticalFailures) {
    console.log('❌ Some critical endpoints failed. Check API key permissions.');
    process.exit(1);
  } else {
    console.log('✅ All critical endpoints working!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
