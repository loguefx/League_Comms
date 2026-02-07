import { Controller, Get, Query, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { IngestionService } from './ingestion.service';
import { PublicChampionSeedService } from './public-champion-seed.service';

@Controller('champions')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private ingestionService: IngestionService,
    private seedService: PublicChampionSeedService
  ) {}

  @Get()
  async getChampionStats(
    @Query('rank') rank?: string,
    @Query('role') role?: string,
    @Query('patch') patch?: string
  ) {
    try {
      const stats = await this.analyticsService.getChampionStats({ rank, role, patch });
      const totalMatches = await this.analyticsService.getTotalMatchesPerRank(patch);

      console.log(`[AnalyticsController] Returning ${stats.length} champions for rank=${rank}, role=${role}, patch=${patch}`);

      return {
        champions: stats,
        totalMatchesPerRank: totalMatches,
      };
    } catch (error) {
      console.error('[AnalyticsController] Error getting champion stats:', error);
      return {
        champions: [],
        totalMatchesPerRank: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Diagnostic endpoint to check database status
   */
  @Get('diagnostics')
  async getDiagnostics() {
    return await this.analyticsService.getDiagnostics();
  }

  /**
   * Seed endpoint to populate champion stats from public high-elo matches
   * This fetches matches from challenger/grandmaster players and aggregates them
   * No authentication required - uses your API key to fetch public data
   * 
   * @param region - Riot API region (e.g., 'na1', 'euw1')
   * @param sourcePlayers - Number of high-elo players to fetch matches from (default: 20)
   *                        More players = more match data = better champion statistics
   */
  @Post('seed')
  async seedChampionStats(
    @Query('region') region: string = 'na1',
    @Query('sourcePlayers') sourcePlayers: string = '20'
  ) {
    try {
      // Run seed in background (don't await to return immediately)
      this.seedService.seedFromHighElo(region as any, parseInt(sourcePlayers, 10)).catch((error) => {
        console.error('[AnalyticsController] Seed error:', error);
      });
      
      return {
        success: true,
        message: 'Seed started in background. This will fetch match data from high-elo players to calculate champion win rates. Check diagnostics endpoint for progress.',
        region,
        sourcePlayers: parseInt(sourcePlayers, 10),
        note: 'This parameter controls how many high-elo players to fetch matches from, not the number of champions displayed.',
      };
    } catch (error) {
      console.error('[AnalyticsController] Seed failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
