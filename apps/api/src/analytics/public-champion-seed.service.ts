import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SummonerClient, MatchClient } from '@league-voice/riot';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
import type { Region } from '@league-voice/shared';

@Injectable()
export class PublicChampionSeedService {
  private readonly logger = new Logger(PublicChampionSeedService.name);
  private summonerClient: SummonerClient;
  private matchClient: MatchClient;

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
   * Seed champion stats by fetching matches from high-elo players
   */
  async seedFromHighElo(region: Region = 'na1', maxPlayers: number = 20): Promise<void> {
    this.logger.log(`Starting seed from high-elo players in ${region}`);

    try {
      // Get challenger league entries
      const challengerLeague = await this.summonerClient.getChallengerLeague(region, 'RANKED_SOLO_5x5');
      const players = challengerLeague.entries.slice(0, maxPlayers);

      this.logger.log(`Found ${players.length} challenger players`);

      let totalMatchesIngested = 0;

      for (const player of players) {
        try {
          // Get summoner by ID to get PUUID
          const summoner = await this.summonerClient.getSummonerById(region, player.summonerId);
          
          // Get recent match IDs (last 20 matches)
          const matchIds = await this.matchClient.getMatchList(region, summoner.puuid, {
            count: 20,
            queue: 420, // Ranked Solo Queue
            type: 'ranked',
          });

          this.logger.log(`Player ${player.summonerName}: Found ${matchIds.length} matches`);

          // Ingest each match (mark as CHALLENGER tier since we're fetching from challenger league)
          for (const matchId of matchIds) {
            try {
              await this.ingestionService.ingestMatch(region, matchId, 'CHALLENGER');
              totalMatchesIngested++;
            } catch (error) {
              this.logger.warn(`Failed to ingest match ${matchId}: ${error}`);
            }
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          this.logger.error(`Error processing player ${player.summonerName}: ${error}`);
        }
      }

      this.logger.log(`Ingested ${totalMatchesIngested} matches total`);

      // Run aggregation to populate champion stats
      this.logger.log('Running aggregation...');
      await this.aggregationService.aggregateChampionStats();

      this.logger.log('Seed complete!');
    } catch (error) {
      this.logger.error('Seed failed:', error);
      throw error;
    }
  }
}
