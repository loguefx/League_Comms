import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SummonerClient, MatchClient, type LeagueEntry } from '@league-voice/riot';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
import { RateLimiterService } from './rate-limiter.service';
import type { Region } from '@league-voice/shared';

export interface SeedProgress {
  totalPlayers: number;
  processedPlayers: number;
  totalMatchesIngested: number;
  currentTier: string;
  currentDivision: string;
  status: 'running' | 'completed' | 'error';
  error?: string;
}

@Injectable()
export class BatchSeedService {
  private readonly logger = new Logger(BatchSeedService.name);
  private summonerClient: SummonerClient;
  private matchClient: MatchClient;
  private seedProgress: SeedProgress | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private ingestionService: IngestionService,
    private aggregationService: AggregationService,
    private rateLimiter: RateLimiterService
  ) {
    const apiKey = this.configService.get<string>('RIOT_API_KEY', '');
    if (!apiKey) {
      this.logger.error('❌ RIOT_API_KEY is missing from environment variables!');
      throw new Error('RIOT_API_KEY is required but not found in environment variables');
    }
    this.logger.log(`✅ API Key loaded: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    this.summonerClient = new SummonerClient({ apiKey });
    this.matchClient = new MatchClient({ apiKey });
  }

  /**
   * Get seed progress
   */
  getProgress(): SeedProgress | null {
    return this.seedProgress;
  }

  /**
   * Batch seed from ALL rank tiers
   * This processes players from Iron through Challenger in batches
   * 
   * @param region - Riot API region
   * @param matchesPerPlayer - Number of matches to fetch per player (default: 100)
   * @param playersPerTierDivision - Number of players to process per tier/division (default: 50)
   * @param batchSize - Number of players to process in parallel (default: 5)
   */
  async batchSeedAllRanks(
    region: Region = 'na1',
    matchesPerPlayer: number = 100,
    playersPerTierDivision: number = 50,
    batchSize: number = 5
  ): Promise<void> {
    this.seedProgress = {
      totalPlayers: 0,
      processedPlayers: 0,
      totalMatchesIngested: 0,
      currentTier: '',
      currentDivision: '',
      status: 'running',
    };

    this.logger.log(`Starting batch seed for ALL ranks in ${region}`);
    this.logger.log(`Config: ${matchesPerPlayer} matches/player, ${playersPerTierDivision} players/tier-division, batch size: ${batchSize}`);

    try {
      const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
      const divisions = ['I', 'II', 'III', 'IV'];
      const masterTiers = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

      let totalMatchesIngested = 0;
      const processedMatchIds = new Set<string>(); // Dedupe matches

      // Process regular tiers (Iron through Diamond)
      for (const tier of tiers) {
        for (const division of divisions) {
          this.seedProgress.currentTier = tier;
          this.seedProgress.currentDivision = division;

          this.logger.log(`Processing ${tier} ${division}...`);

          try {
            // Get players from this tier/division (page 1)
            const players = await this.summonerClient.getLeagueEntriesByTier(
              region,
              'RANKED_SOLO_5x5',
              tier,
              division,
              1
            );

            // Validate players array and filter out invalid entries
            if (!Array.isArray(players)) {
              this.logger.warn(`Invalid response from getLeagueEntriesByTier for ${tier} ${division}: not an array`);
              continue;
            }

            // Filter out players without required fields (need either puuid OR summonerId)
            const validPlayers = players.filter(p => 
              p && 
              ((p.puuid && typeof p.puuid === 'string') || (p.summonerId && typeof p.summonerId === 'string'))
            );
            
            if (validPlayers.length === 0) {
              this.logger.warn(`No valid players found in ${tier} ${division} (got ${players.length} total, all invalid)`);
              if (players.length > 0) {
                this.logger.debug(`Sample player structure: ${JSON.stringify(players[0])}`);
              }
              continue;
            }

            const playersToProcess = validPlayers.slice(0, playersPerTierDivision);
            this.seedProgress.totalPlayers += playersToProcess.length;

            this.logger.log(`Found ${players.length} players in ${tier} ${division}, ${validPlayers.length} valid, processing ${playersToProcess.length}`);

            // Process in batches
            for (let i = 0; i < playersToProcess.length; i += batchSize) {
              const batch = playersToProcess.slice(i, i + batchSize);
              
              await Promise.all(
                batch.map(async (player) => {
                  try {
                    // Rate limit: wait before API calls
                    await this.rateLimiter.waitForRequest();
                    
                    // Get PUUID - use directly if available, otherwise fetch via summonerId
                    let puuid: string;
                    
                    if (player.puuid && typeof player.puuid === 'string') {
                      // PUUID is already in the response - use it directly (faster!)
                      puuid = player.puuid;
                      this.logger.debug(`Using PUUID directly from league entry for ${player.summonerName}`);
                    } else if (player.summonerId && typeof player.summonerId === 'string') {
                      // Need to fetch PUUID via Summoner API
                      await this.rateLimiter.waitForRequest();
                      const summoner = await this.summonerClient.getSummonerById(region, player.summonerId);
                      puuid = summoner.puuid;
                    } else {
                      this.logger.error(`Player ${player.summonerName} has neither puuid nor summonerId`);
                      return;
                    }
                    
                    // Get match IDs
                    await this.rateLimiter.waitForRequest();
                    const matchIds = await this.matchClient.getMatchList(region, puuid, {
                      count: matchesPerPlayer,
                      queue: 420, // Ranked Solo
                      type: 'ranked',
                    });

                    this.logger.log(`Player ${player.summonerName}: Found ${matchIds.length} matches`);

                    // Ingest matches (dedupe)
                    for (const matchId of matchIds) {
                      if (!processedMatchIds.has(matchId)) {
                        try {
                          // Convert tier to rank_bracket format (e.g., "EMERALD" -> "emerald", "MASTER" -> "master_plus")
                          const rankBracket = this.tierToRankBracket(tier);
                          await this.ingestionService.ingestMatch(region, matchId, rankBracket);
                          processedMatchIds.add(matchId);
                          totalMatchesIngested++;
                          this.seedProgress.totalMatchesIngested = totalMatchesIngested;
                        } catch (error) {
                          this.logger.warn(`Failed to ingest match ${matchId}: ${error}`);
                        }
                      }
                    }

                    this.seedProgress.processedPlayers++;
                  } catch (error) {
                    this.logger.error(`Error processing player ${player.summonerName}: ${error}`);
                  }
                })
              );

              // Batch delay (rate limiter handles this)
              await this.rateLimiter.waitForBatch();
            }
          } catch (error) {
            this.logger.error(`Error processing ${tier} ${division}: ${error}`);
          }
        }
      }

      // Process Master+ tiers (no divisions)
      for (const tier of masterTiers) {
        this.seedProgress.currentTier = tier;
        this.seedProgress.currentDivision = '';

        this.logger.log(`Processing ${tier}...`);

        try {
          let leagueData;
          if (tier === 'CHALLENGER') {
            leagueData = await this.summonerClient.getChallengerLeague(region, 'RANKED_SOLO_5x5');
          } else if (tier === 'GRANDMASTER') {
            leagueData = await this.summonerClient.getGrandmasterLeague(region, 'RANKED_SOLO_5x5');
          } else {
            leagueData = await this.summonerClient.getMasterLeague(region, 'RANKED_SOLO_5x5');
          }

          // Validate leagueData structure
          if (!leagueData || !Array.isArray(leagueData.entries)) {
            this.logger.warn(`Invalid response from ${tier} league API`);
            continue;
          }

          // Filter out players without required fields (need either puuid OR summonerId)
          const validPlayers = leagueData.entries.filter(p => 
            p && 
            ((p.puuid && typeof p.puuid === 'string') || (p.summonerId && typeof p.summonerId === 'string'))
          );
          
          if (validPlayers.length === 0) {
            this.logger.warn(`No valid players found in ${tier} (got ${leagueData.entries.length} total, all invalid)`);
            if (leagueData.entries.length > 0) {
              this.logger.debug(`Sample player structure: ${JSON.stringify(leagueData.entries[0])}`);
            }
            continue;
          }

          const players = validPlayers.slice(0, playersPerTierDivision);
          this.seedProgress.totalPlayers += players.length;

          this.logger.log(`Found ${leagueData.entries.length} players in ${tier}, ${validPlayers.length} valid, processing ${players.length}`);

          // Process in batches
          for (let i = 0; i < players.length; i += batchSize) {
            const batch = players.slice(i, i + batchSize);
            
            await Promise.all(
              batch.map(async (player) => {
                  try {
                    // Get PUUID - use directly if available, otherwise fetch via summonerId
                    let puuid: string;
                    
                    // Rate limit: wait before API calls
                    await this.rateLimiter.waitForRequest();
                    
                    if (player.puuid && typeof player.puuid === 'string') {
                      // PUUID is already in the response - use it directly (faster!)
                      puuid = player.puuid;
                      this.logger.debug(`Using PUUID directly from league entry for ${player.summonerName}`);
                    } else if (player.summonerId && typeof player.summonerId === 'string') {
                      // Need to fetch PUUID via Summoner API
                      await this.rateLimiter.waitForRequest();
                      const summoner = await this.summonerClient.getSummonerById(region, player.summonerId);
                      puuid = summoner.puuid;
                    } else {
                      this.logger.error(`Player ${player.summonerName} has neither puuid nor summonerId`);
                      return;
                    }
                    
                    await this.rateLimiter.waitForRequest();
                    const matchIds = await this.matchClient.getMatchList(region, puuid, {
                      count: matchesPerPlayer,
                      queue: 420,
                      type: 'ranked',
                    });

                    this.logger.log(`Player ${player.summonerName}: Found ${matchIds.length} matches`);

                    for (const matchId of matchIds) {
                      if (!processedMatchIds.has(matchId)) {
                        try {
                          // Convert tier to rank_bracket format
                          const rankBracket = this.tierToRankBracket(tier);
                          await this.ingestionService.ingestMatch(region, matchId, rankBracket);
                          processedMatchIds.add(matchId);
                          totalMatchesIngested++;
                          this.seedProgress.totalMatchesIngested = totalMatchesIngested;
                        } catch (error) {
                          this.logger.warn(`Failed to ingest match ${matchId}: ${error}`);
                        }
                      }
                    }

                    this.seedProgress.processedPlayers++;
                  } catch (error) {
                    this.logger.error(`Error processing player ${player.summonerName}: ${error}`);
                  }
              })
            );

            await this.rateLimiter.waitForBatch();
          }
        } catch (error) {
          this.logger.error(`Error processing ${tier}: ${error}`);
        }
      }

      this.logger.log(`Ingested ${totalMatchesIngested} unique matches total`);

      // Run aggregation to populate champion stats and build data
      // This ensures data is immediately available after batch seeding
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('🔄 Batch seed complete - Triggering automatic aggregation...');
      this.logger.log('═══════════════════════════════════════════════════════════');
      try {
        await this.aggregationService.aggregateChampionStats();
        this.logger.log('✅ Automatic aggregation completed successfully after batch seed');
      } catch (error) {
        this.logger.error('❌ Aggregation after batch seed failed:', error);
        throw error; // Re-throw so caller knows seed didn't fully complete
      }

      this.seedProgress.status = 'completed';
      this.logger.log('✅ Batch seed complete!');
    } catch (error) {
      this.logger.error('Batch seed failed:', error);
      this.seedProgress.status = 'error';
      this.seedProgress.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Convert tier to rank_bracket format using U.GG utility
   * Examples: "EMERALD" -> "emerald", "MASTER" -> "master_plus", "CHALLENGER" -> "master_plus"
   */
  private tierToRankBracket(tier: string): string {
    return convertTierToRankBracket(tier);
  }
}
