import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

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
}
