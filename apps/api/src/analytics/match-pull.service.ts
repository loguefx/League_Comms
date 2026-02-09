import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SummonerClient, MatchClient } from '@league-voice/riot';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
import { RateLimiterService } from './rate-limiter.service';
import type { Region } from '@league-voice/shared';

/**
 * Service to automatically pull matches from all regions
 * Runs on startup and then every 10 minutes
 */
@Injectable()
export class MatchPullService implements OnModuleInit {
  private readonly logger = new Logger(MatchPullService.name);
  private summonerClient: SummonerClient;
  private matchClient: MatchClient;

  // All Riot regions to collect from
  private readonly regions: Region[] = [
    'na1', 'euw1', 'eun1', 'kr', 'br1', 'la1', 'la2', 
    'oc1', 'ru', 'tr1', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'
  ];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private ingestionService: IngestionService,
    private aggregationService: AggregationService,
    private rateLimiter: RateLimiterService
  ) {
    this.logger.log('[MatchPullService] Constructor called');
    const apiKey = this.configService.get<string>('RIOT_API_KEY', '');
    if (!apiKey) {
      this.logger.warn('[MatchPullService] RIOT_API_KEY not found - automatic match pulling disabled');
      return;
    }
    this.logger.log('[MatchPullService] API Key found, initializing clients...');
    this.summonerClient = new SummonerClient({ apiKey });
    this.matchClient = new MatchClient({ apiKey });
    this.logger.log('[MatchPullService] Clients initialized successfully');
  }

  /**
   * Pull matches on server startup
   */
  async onModuleInit() {
    this.logger.log('[MatchPullService] onModuleInit called - waiting 5 seconds for server to be ready...');
    
    // Wait a bit for other services to initialize and server to start listening
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    this.logger.log('[MatchPullService] Starting initial match pull on startup...');
    try {
      await this.pullMatchesFromAllRegions();
      this.logger.log('[MatchPullService] Initial match pull complete');
    } catch (error) {
      this.logger.error('[MatchPullService] Initial match pull failed:', error);
      if (error instanceof Error) {
        this.logger.error('[MatchPullService] Error details:', error.message, error.stack);
      }
    }
  }

  /**
   * Scheduled match pulling - runs every 2 minutes
   * This ensures we're constantly gathering fresh match data
   */
  @Cron('*/2 * * * *') // Every 2 minutes using cron syntax
  async scheduledMatchPull() {
    this.logger.log('Running scheduled match pull...');
    try {
      await this.pullMatchesFromAllRegions();
      this.logger.log('Scheduled match pull complete');
    } catch (error) {
      this.logger.error('Scheduled match pull failed:', error);
    }
  }

  /**
   * Pull matches from all regions
   * For each region, fetches matches from high-elo players
   */
  private async pullMatchesFromAllRegions(): Promise<void> {
    const playersPerRegion = 10; // Number of high-elo players per region
    const matchesPerPlayer = 20; // Number of matches per player

    // #region agent log
    const startTime = Date.now();
    let totalMatchesIngested = 0;
    // #endregion

    for (const region of this.regions) {
      try {
        this.logger.log(`Pulling matches from ${region}...`);
        const matchesBefore = await this.prisma.match.count();
        await this.pullMatchesFromRegion(region, playersPerRegion, matchesPerPlayer);
        const matchesAfter = await this.prisma.match.count();
        const newMatches = matchesAfter - matchesBefore;
        totalMatchesIngested += newMatches;
        
        // #region agent log
        console.log(`[pullMatchesFromAllRegions] Region ${region}: ${newMatches} new matches ingested`);
        fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:93',message:'Region match pull complete',data:{region,newMatches,matchesBefore,matchesAfter},timestamp:Date.now(),runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Small delay between regions to respect rate limits
        await this.rateLimiter.waitForBatch();
      } catch (error: any) {
        // Log error but continue with next region
        // pullMatchesFromRegion already handles most errors gracefully
        if (error?.code !== 'ENOTFOUND' && error?.code !== 'ECONNREFUSED') {
          this.logger.error(`Failed to pull matches from ${region}:`, error?.message || error);
        }
        // Continue with next region even if one fails
      }
    }

    // #region agent log
    const endTime = Date.now();
    const duration = endTime - startTime;
    const totalMatchesInDb = await this.prisma.match.count();
    console.log(`[pullMatchesFromAllRegions] Complete: ${totalMatchesIngested} new matches ingested, ${totalMatchesInDb} total matches in DB, took ${duration}ms`);
    fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:114',message:'Match pull complete summary',data:{totalMatchesIngested,totalMatchesInDb,durationMs:duration},timestamp:Date.now(),runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Run aggregation after pulling matches
    // This ensures champion stats and build data are updated immediately after new matches are ingested
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('🔄 Match pull complete - Triggering automatic aggregation...');
    this.logger.log(`📊 Total matches in database: ${totalMatchesInDb}`);
    this.logger.log(`📥 New matches ingested this run: ${totalMatchesIngested}`);
    this.logger.log('═══════════════════════════════════════════════════════════');
    
    if (totalMatchesInDb === 0) {
      this.logger.warn('⚠️ No matches found in database - aggregation will have no data to process');
      this.logger.warn('⚠️ Check if match pulling is working correctly and Riot API key is configured');
      return; // Skip aggregation if no matches exist
    }
    
    try {
      // #region agent log
      const aggStartTime = Date.now();
      console.log('[pullMatchesFromAllRegions] Starting aggregation...');
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:130',message:'Starting aggregation after match pull',data:{totalMatchesInDb},timestamp:Date.now(),runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      await this.aggregationService.aggregateChampionStats();
      
      // #region agent log
      const aggEndTime = Date.now();
      const aggDuration = aggEndTime - aggStartTime;
      const championStatsCount = await this.prisma.championStat.count();
      const itemBuildsCount = await this.prisma.championItemBuild.count();
      const runePagesCount = await this.prisma.championRunePage.count();
      console.log(`[pullMatchesFromAllRegions] Aggregation complete: ${championStatsCount} champion stats, ${itemBuildsCount} item builds, ${runePagesCount} rune pages, took ${aggDuration}ms`);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:138',message:'Aggregation complete after match pull',data:{championStatsCount,itemBuildsCount,runePagesCount,aggDurationMs:aggDuration},timestamp:Date.now(),runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      this.logger.log('✅ Automatic aggregation completed successfully after match pull');
    } catch (error) {
      this.logger.error('❌ Aggregation after match pull failed:', error);
      // #region agent log
      console.error('[pullMatchesFromAllRegions] Aggregation error:', error);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:145',message:'Aggregation error after match pull',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),runId:'debug1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Don't throw - allow match pulling to complete even if aggregation fails
      // Aggregation will retry on next scheduled run (every 2 minutes)
    }
  }

  /**
   * Pull matches from a specific region
   */
  private async pullMatchesFromRegion(
    region: Region,
    playersPerRegion: number,
    matchesPerPlayer: number
  ): Promise<void> {
    try {
      // #region agent log
      console.log(`[pullMatchesFromRegion] Starting match pull for region ${region}`);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:183',message:'Starting region match pull',data:{region,playersPerRegion,matchesPerPlayer},timestamp:Date.now(),runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Get challenger league entries
      const challengerLeague = await this.summonerClient.getChallengerLeague(region, 'RANKED_SOLO_5x5');
      const players = challengerLeague.entries.slice(0, playersPerRegion);

      if (players.length === 0) {
        this.logger.warn(`No challenger players found in ${region}`);
        // #region agent log
        console.warn(`[pullMatchesFromRegion] No challenger players found in ${region}`);
        fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:192',message:'No challenger players found',data:{region},timestamp:Date.now(),runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return;
      }

      this.logger.log(`Found ${players.length} challenger players in ${region}`);
      
      // #region agent log
      console.log(`[pullMatchesFromRegion] Found ${players.length} challenger players in ${region}`);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:198',message:'Challenger players found',data:{region,playersCount:players.length},timestamp:Date.now(),runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      let totalMatchesIngested = 0;
      const processedMatchIds = new Set<string>();
      
      // #region agent log
      const dbCountAtStart = await this.prisma.match.count();
      console.log(`[pullMatchesFromRegion] Starting match pull for ${region}, DB count at start: ${dbCountAtStart}`);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:210',message:'Starting region match pull',data:{region,dbCountAtStart},timestamp:Date.now(),runId:'debug2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      for (const player of players) {
        try {
          // Use PUUID directly if available, otherwise fetch summoner
          let puuid: string;
          if (player.puuid) {
            puuid = player.puuid;
          } else if (player.summonerId) {
            const summoner = await this.summonerClient.getSummonerById(region, player.summonerId);
            puuid = summoner.puuid;
          } else {
            this.logger.warn(`No PUUID or summonerId for player in ${region}`);
            continue;
          }

          // Wait for rate limit
          await this.rateLimiter.waitForRequest();

          // Get recent match IDs
          const matchIds = await this.matchClient.getMatchList(region, puuid, {
            count: matchesPerPlayer,
            queue: 420, // Ranked Solo Queue
            type: 'ranked',
          });

          // #region agent log
          console.log(`[pullMatchesFromRegion] Player ${player.summonerName || puuid}: Got ${matchIds.length} match IDs`);
          const duplicateCount = matchIds.filter(id => processedMatchIds.has(id)).length;
          if (duplicateCount > 0) {
            console.log(`[pullMatchesFromRegion] Player ${player.summonerName || puuid}: ${duplicateCount} match IDs already in processedMatchIds Set`);
          }
          fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:234',message:'Got match IDs from player',data:{region,playerName:player.summonerName,puuid,matchIdsCount:matchIds.length,duplicateCount,processedMatchIdsSize:processedMatchIds.size},timestamp:Date.now(),runId:'debug2',hypothesisId:'C'})}).catch(()=>{});
          // #endregion

          // Ingest each match (dedupe by match ID)
          for (const matchId of matchIds) {
            if (processedMatchIds.has(matchId)) {
              // #region agent log
              console.log(`[pullMatchesFromRegion] Match ${matchId} already in processedMatchIds Set, skipping`);
              fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:240',message:'Match already in processedMatchIds Set',data:{matchId,region},timestamp:Date.now(),runId:'debug2',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              continue; // Skip already processed matches
            }

            try {
              await this.ingestionService.ingestMatch(region, matchId, 'master_plus');
              processedMatchIds.add(matchId);
              totalMatchesIngested++;
              
              // #region agent log
              if (totalMatchesIngested % 10 === 0) {
                const currentDbCount = await this.prisma.match.count();
                console.log(`[pullMatchesFromRegion] Progress: ${totalMatchesIngested} matches ingested from ${region}, DB count: ${currentDbCount}`);
                fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:252',message:'Match ingestion progress',data:{region,totalMatchesIngested,currentDbCount},timestamp:Date.now(),runId:'debug2',hypothesisId:'A'})}).catch(()=>{});
              }
              // #endregion
            } catch (error) {
              this.logger.debug(`Failed to ingest match ${matchId}: ${error}`);
              // #region agent log
              console.error(`[pullMatchesFromRegion] Failed to ingest match ${matchId}:`, error);
              fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:258',message:'Match ingestion failed',data:{matchId,region,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),runId:'debug2',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
            }
          }

          // Small delay between players
          await this.rateLimiter.waitForRequest();
        } catch (error) {
          this.logger.warn(`Error processing player in ${region}: ${error}`);
        }
      }

      this.logger.log(`Ingested ${totalMatchesIngested} new matches from ${region}`);
      
      // #region agent log
      console.log(`[pullMatchesFromRegion] Region ${region}: ${totalMatchesIngested} matches ingested`);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-pull.service.ts:185',message:'Region match ingestion complete',data:{region,totalMatchesIngested},timestamp:Date.now(),runId:'debug1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error: any) {
      // Handle various error cases gracefully
      // 404: No challenger league in some regions (this is OK)
      if (error?.response?.status === 404 || error?.status === 404) {
        this.logger.debug(`No challenger league in ${region} (this is OK)`);
        return;
      }
      
      // DNS/Network errors: Some regions may not have League-V4 API support
      // (e.g., ph2, sg2, th2, tw2, vn2 are valid for Match-V5 but not League-V4)
      if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || error?.message?.includes('getaddrinfo')) {
        this.logger.warn(`Region ${region} not supported by League-V4 API (DNS/Network error). Skipping...`);
        this.logger.debug(`Error details: ${error.message}`);
        return; // Skip this region, continue with others
      }
      
      // Other errors: log and rethrow to be caught by outer handler
      this.logger.error(`Unexpected error pulling matches from ${region}:`, error);
      throw error;
    }
  }
}
