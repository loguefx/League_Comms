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
   */
  @Post('seed')
  async seedChampionStats(
    @Query('region') region: string = 'na1',
    @Query('maxPlayers') maxPlayers: string = '20'
  ) {
    try {
      this.seedService.seedFromHighElo(region as any, parseInt(maxPlayers, 10));
      return {
        success: true,
        message: 'Seed started in background. Check diagnostics endpoint for progress.',
        region,
        maxPlayers: parseInt(maxPlayers, 10),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
