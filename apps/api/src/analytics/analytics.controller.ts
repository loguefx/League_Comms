import { Controller, Get, Query, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { IngestionService } from './ingestion.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private ingestionService: IngestionService
  ) {}

  @Get('champions')
  async getChampionStats(
    @Query('rank') rank?: string,
    @Query('role') role?: string,
    @Query('patch') patch?: string
  ) {
    const stats = await this.analyticsService.getChampionStats({ rank, role, patch });
    const totalMatches = await this.analyticsService.getTotalMatchesPerRank(patch);

    return {
      champions: stats,
      totalMatchesPerRank: totalMatches,
    };
  }

  /**
   * Seed endpoint to populate initial champion stats
   * This fetches public match data using the Riot API key
   * Note: This is a development/admin endpoint - in production, you'd want to protect it
   */
  @Post('seed')
  async seedChampionStats(
    @Query('region') region: string = 'na1',
    @Query('count') count: string = '10'
  ) {
    // This would fetch public matches and ingest them
    // For now, return a message indicating the endpoint exists
    return {
      message: 'Seed endpoint - This will fetch and ingest public match data',
      note: 'Implementation needed: Fetch public match IDs and ingest them',
      region,
      count: parseInt(count, 10),
    };
  }
}
