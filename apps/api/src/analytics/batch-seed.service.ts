import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SummonerClient, MatchClient } from '@league-voice/riot';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
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
    private aggregationService: AggregationService
  ) {
    const apiKey = this.configService.get<string>('RIOT_API_KEY', '');
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

            const playersToProcess = players.slice(0, playersPerTierDivision);
            this.seedProgress.totalPlayers += playersToProcess.length;

            this.logger.log(`Found ${players.length} players in ${tier} ${division}, processing ${playersToProcess.length}`);

            // Process in batches
            for (let i = 0; i < playersToProcess.length; i += batchSize) {
              const batch = playersToProcess.slice(i, i + batchSize);
              
              await Promise.all(
                batch.map(async (player) => {
                  try {
                    // Get summoner to get PUUID
                    const summoner = await this.summonerClient.getSummonerById(region, player.summonerId);
                    
                    // Get match IDs
                    const matchIds = await this.matchClient.getMatchList(region, summoner.puuid, {
                      count: matchesPerPlayer,
                      queue: 420, // Ranked Solo
                      type: 'ranked',
                    });

                    this.logger.log(`Player ${player.summonerName}: Found ${matchIds.length} matches`);

                    // Ingest matches (dedupe)
                    for (const matchId of matchIds) {
                      if (!processedMatchIds.has(matchId)) {
                        try {
                          // Determine rank tier from player's tier
                          await this.ingestionService.ingestMatch(region, matchId, tier);
                          processedMatchIds.add(matchId);
                          totalMatchesIngested++;
                          this.seedProgress.totalMatchesIngested = totalMatchesIngested;
                        } catch (error) {
                          this.logger.warn(`Failed to ingest match ${matchId}: ${error}`);
                        }
                      }
                    }

                    this.seedProgress.processedPlayers++;
                    
                    // Rate limit delay (1200ms = ~50 requests/minute, well under 100/min limit)
                    await new Promise(resolve => setTimeout(resolve, 1200));
                  } catch (error) {
                    this.logger.error(`Error processing player ${player.summonerName}: ${error}`);
                  }
                })
              );

              // Batch delay
              await new Promise(resolve => setTimeout(resolve, 2000));
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

          const players = leagueData.entries.slice(0, playersPerTierDivision);
          this.seedProgress.totalPlayers += players.length;

          // Process in batches
          for (let i = 0; i < players.length; i += batchSize) {
            const batch = players.slice(i, i + batchSize);
            
            await Promise.all(
              batch.map(async (player) => {
                  try {
                    // Get summoner to get PUUID (Master+ entries don't have PUUID directly)
                    const summoner = await this.summonerClient.getSummonerById(region, player.summonerId);
                    
                    const matchIds = await this.matchClient.getMatchList(region, summoner.puuid, {
                      count: matchesPerPlayer,
                      queue: 420,
                      type: 'ranked',
                    });

                    this.logger.log(`Player ${player.summonerName}: Found ${matchIds.length} matches`);

                    for (const matchId of matchIds) {
                      if (!processedMatchIds.has(matchId)) {
                        try {
                          await this.ingestionService.ingestMatch(region, matchId, tier);
                          processedMatchIds.add(matchId);
                          totalMatchesIngested++;
                          this.seedProgress.totalMatchesIngested = totalMatchesIngested;
                        } catch (error) {
                          this.logger.warn(`Failed to ingest match ${matchId}: ${error}`);
                        }
                      }
                    }

                    this.seedProgress.processedPlayers++;
                    await new Promise(resolve => setTimeout(resolve, 1200));
                  } catch (error) {
                    this.logger.error(`Error processing player ${player.summonerName}: ${error}`);
                  }
              })
            );

            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          this.logger.error(`Error processing ${tier}: ${error}`);
        }
      }

      this.logger.log(`Ingested ${totalMatchesIngested} unique matches total`);

      // Run aggregation
      this.logger.log('Running aggregation for all patches and ranks...');
      await this.aggregationService.aggregateChampionStats();

      this.seedProgress.status = 'completed';
      this.logger.log('Batch seed complete!');
    } catch (error) {
      this.logger.error('Batch seed failed:', error);
      this.seedProgress.status = 'error';
      this.seedProgress.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }
}
