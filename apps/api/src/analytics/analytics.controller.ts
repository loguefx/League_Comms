import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
import { BuildAggregationService } from './build-aggregation.service';
import { PublicChampionSeedService } from './public-champion-seed.service';
import { BatchSeedService } from './batch-seed.service';

@Controller('champions')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private ingestionService: IngestionService,
    private aggregationService: AggregationService,
    private buildAggregationService: BuildAggregationService,
    private seedService: PublicChampionSeedService,
    private batchSeedService: BatchSeedService
  ) {}

  @Get()
  async getChampionStats(
    @Query('rank') rank?: string,
    @Query('role') role?: string,
    @Query('patch') patch?: string,
    @Query('region') region?: string
  ) {
    console.log(`[AnalyticsController] GET /champions called with params:`, { rank, role, patch, region });
    try {
      const stats = await this.analyticsService.getChampionStats({ rank, role, patch, region });

      console.log(`[AnalyticsController] Service returned ${stats?.length || 0} champions`);
      console.log(`[AnalyticsController] First 3 champions (if any):`, stats?.slice(0, 3));

      // Ensure stats is an array and properly formatted
      const champions = Array.isArray(stats) ? stats : [];
      
      // Convert any remaining BigInt values to numbers (safety check)
      // Also ensure all values are properly typed for JSON serialization
      const sanitizedChampions = champions.map((champ: any) => {
        try {
          return {
            championId: Number(champ.championId) || 0,
            games: Number(champ.games) || 0,
            wins: Number(champ.wins) || 0,
            winRate: Number(champ.winRate) || 0,
            pickRate: Number(champ.pickRate) || 0,
            banRate: Number(champ.banRate) || 0,
            counterPicks: Array.isArray(champ.counterPicks) 
              ? champ.counterPicks.map((id: any) => Number(id) || 0).filter((id: number) => id > 0)
              : [],
          };
        } catch (mapError) {
          console.error(`[AnalyticsController] Error mapping champion:`, mapError, champ);
          return null;
        }
      }).filter((champ: any) => champ !== null);

      const response = {
        champions: sanitizedChampions,
      };

      // Log response size for debugging
      console.log(`[AnalyticsController] Returning ${sanitizedChampions.length} champions, response size: ${JSON.stringify(response).length} bytes`);

      return response;
    } catch (error) {
      console.error('[AnalyticsController] Error getting champion stats:', error);
      if (error instanceof Error) {
        console.error('[AnalyticsController] Error stack:', error.stack);
      }
      return {
        champions: [],
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

  /**
   * Batch seed endpoint - processes players from ALL rank tiers in batches
   * This can capture millions of matches across all ranks
   * 
   * @param region - Riot API region (e.g., 'na1')
   * @param matchesPerPlayer - Number of matches to fetch per player (default: 100)
   * @param playersPerTierDivision - Number of players per tier/division (default: 50)
   * @param batchSize - Number of players to process in parallel (default: 5)
   */
  @Post('seed/batch')
  async batchSeedAllRanks(
    @Query('region') region: string = 'na1',
    @Query('matchesPerPlayer') matchesPerPlayer: string = '100',
    @Query('playersPerTierDivision') playersPerTierDivision: string = '50',
    @Query('batchSize') batchSize: string = '5'
  ) {
    try {
      // Run batch seed in background
      this.batchSeedService.batchSeedAllRanks(
        region as any,
        parseInt(matchesPerPlayer, 10),
        parseInt(playersPerTierDivision, 10),
        parseInt(batchSize, 10)
      ).catch((error) => {
        console.error('[AnalyticsController] Batch seed error:', error);
      });

      return {
        success: true,
        message: 'Batch seed started in background. This will process players from ALL rank tiers (Iron through Challenger) to capture millions of matches. Check /champions/progress for status.',
        region,
        matchesPerPlayer: parseInt(matchesPerPlayer, 10),
        playersPerTierDivision: parseInt(playersPerTierDivision, 10),
        batchSize: parseInt(batchSize, 10),
        estimatedMatches: `~${parseInt(playersPerTierDivision, 10) * 28 * parseInt(matchesPerPlayer, 10)} matches (28 tier-division combinations × players × matches)`,
      };
    } catch (error) {
      console.error('[AnalyticsController] Batch seed failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get batch seed progress
   */
  @Get('progress')
  async getSeedProgress() {
    const progress = this.batchSeedService.getProgress();
    return progress || { status: 'not_running', message: 'No seed operation in progress' };
  }

  /**
   * Get available patches from database
   */
  @Get('patches')
  async getAvailablePatches() {
    console.log(`[AnalyticsController] GET /champions/patches called`);
    try {
      console.log(`[AnalyticsController] Calling analyticsService.getAvailablePatches()...`);
      const result = await this.analyticsService.getAvailablePatches();
      console.log(`[AnalyticsController] Service returned:`, JSON.stringify(result, null, 2));
      console.log(`[AnalyticsController] Patches count: ${result.patches?.length || 0}, Latest: ${result.latest || 'null'}`);
      
      // Ensure response is always in the correct format
      const response = {
        patches: Array.isArray(result.patches) ? result.patches : [],
        latest: result.latest || null,
      };
      
      console.log(`[AnalyticsController] Returning response:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[AnalyticsController] Error getting patches:', error);
      if (error instanceof Error) {
        console.error('[AnalyticsController] Error stack:', error.stack);
      }
      return {
        patches: [],
        latest: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Manually trigger aggregation (converts raw matches into champion stats)
   * This is useful after ingesting matches to immediately see results
   */
  @Post('aggregate')
  async triggerAggregation() {
    try {
      await this.aggregationService.aggregateChampionStats();
      return {
        success: true,
        message: 'Aggregation complete. Champion stats have been updated from raw match data.',
      };
    } catch (error) {
      console.error('[AnalyticsController] Aggregation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recommended build for a champion (runes, spells, items)
   * Similar to U.GG's champion build page
   * 
   * @param championId - Champion ID (e.g., 103 for Ahri)
   * @param rank - Rank bracket (e.g., 'emerald_plus', 'all_ranks')
   * @param role - Role (e.g., 'MIDDLE', 'ALL')
   * @param patch - Patch version (e.g., '16.3') or 'latest'
   * @param region - Region (e.g., 'na1') or 'world' for all regions
   */
  @Get(':championId/build')
  async getChampionBuild(
    @Param('championId') championId: string,
    @Query('rank') rank?: string,
    @Query('role') role?: string,
    @Query('patch') patch?: string,
    @Query('region') region?: string
  ) {
    try {
      const champId = parseInt(championId, 10);
      if (isNaN(champId)) {
        return {
          error: 'Invalid champion ID',
        };
      }

      // Get latest patch if 'latest' or not provided
      let actualPatch = patch;
      if (!actualPatch || actualPatch === 'latest') {
        const patches = await this.analyticsService.getAvailablePatches();
        actualPatch = patches.latest || null;
        if (!actualPatch) {
          return {
            error: 'No patch data available',
          };
        }
      }

      // Normalize rank bracket
      const rankBracket = rank || 'all_ranks';
      const normalizedRole = role || 'ALL';
      const normalizedRegion = region === 'world' || !region ? null : region;

      // Get tier stats for this champion
      const tierStats = await this.analyticsService.getChampionStats({
        rank: rankBracket,
        role: normalizedRole,
        patch: actualPatch,
        region: normalizedRegion,
      });
      const championStats = tierStats.find((s: any) => s.championId === champId);

      // Get recommended builds (multiple options)
      const [runes, spells, items] = await Promise.all([
        this.buildAggregationService.getRecommendedRunes(
          champId,
          actualPatch,
          rankBracket,
          normalizedRole,
          normalizedRegion,
          5 // Get top 5 rune pages
        ),
        this.buildAggregationService.getRecommendedSpells(
          champId,
          actualPatch,
          rankBracket,
          normalizedRole,
          normalizedRegion,
          5 // Get top 5 spell sets
        ),
        this.buildAggregationService.getRecommendedItems(
          champId,
          actualPatch,
          rankBracket,
          normalizedRole,
          normalizedRegion,
          5 // Get top 5 item builds
        ),
      ]);

      return {
        championId: champId,
        patch: actualPatch,
        rank: rankBracket,
        role: normalizedRole,
        region: normalizedRegion || 'world',
        tierStats: championStats || null,
        recommended: {
          runes: runes.length > 0 ? runes.map((r) => ({
            primaryStyleId: r.primaryStyleId,
            subStyleId: r.subStyleId,
            perkIds: r.perkIds,
            statShards: r.statShards,
            winRate: r.winRate * 100, // Convert to percentage
            games: r.games,
          })) : [],
          spells: spells.length > 0 ? spells.map((s) => ({
            spell1Id: s.spell1Id,
            spell2Id: s.spell2Id,
            winRate: s.winRate * 100, // Convert to percentage
            games: s.games,
          })) : [],
          items: items.length > 0 ? items.map((i) => ({
            items: i.items,
            winRate: i.winRate * 100, // Convert to percentage
            games: i.games,
          })) : [],
        },
        alternatives: {
          runes: runes.slice(1).map(r => ({
            primaryStyleId: r.primaryStyleId,
            subStyleId: r.subStyleId,
            perkIds: r.perkIds,
            statShards: r.statShards,
            winRate: r.winRate * 100,
            games: r.games,
          })),
          spells: spells.slice(1).map(s => ({
            spell1Id: s.spell1Id,
            spell2Id: s.spell2Id,
            winRate: s.winRate * 100,
            games: s.games,
          })),
          items: items.slice(1).map(i => ({
            items: i.items,
            winRate: i.winRate * 100,
            games: i.games,
          })),
        },
      };
    } catch (error) {
      console.error('[AnalyticsController] Error getting champion build:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
