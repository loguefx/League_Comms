import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
import { BuildAggregationService } from './build-aggregation.service';
import { PublicChampionSeedService } from './public-champion-seed.service';
import { BatchSeedService } from './batch-seed.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('champions')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private ingestionService: IngestionService,
    private aggregationService: AggregationService,
    private buildAggregationService: BuildAggregationService,
    private seedService: PublicChampionSeedService,
    private batchSeedService: BatchSeedService,
    private prisma: PrismaService
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
   * Get list of champions that have build data available
   * Useful for testing and finding which champions to view
   */
  @Get('with-builds')
  async getChampionsWithBuilds(
    @Query('patch') patch?: string,
    @Query('rank') rank?: string,
    @Query('role') role?: string,
    @Query('region') region?: string
  ) {
    try {
      let actualPatch = patch;
      if (!actualPatch || actualPatch === 'latest') {
        const patches = await this.analyticsService.getAvailablePatches();
        actualPatch = patches.latest || null;
        if (!actualPatch) {
          return {
            champions: [],
            message: 'No patch data available',
          };
        }
      }

      const rankBracket = rank || 'all_ranks';
      const normalizedRole = role === 'ALL' || !role ? 'ALL' : role;
      const normalizedRegion = region === 'world' || !region ? null : region;

      // Query champions that have rune pages (indicating build data exists)
      const championsWithRunes = await this.prisma.$queryRaw<Array<{
        champion_id: number;
        rune_pages: bigint;
        item_builds: bigint;
        spell_sets: bigint;
      }>>`
        SELECT 
          crp.champion_id,
          COUNT(DISTINCT crp.primary_style_id || '-' || crp.sub_style_id)::bigint as rune_pages,
          COALESCE(MAX(cib_count.item_builds), 0)::bigint as item_builds,
          COALESCE(MAX(css_count.spell_sets), 0)::bigint as spell_sets
        FROM champion_rune_pages crp
        LEFT JOIN (
          SELECT 
            champion_id,
            COUNT(DISTINCT build_type)::bigint as item_builds
          FROM champion_item_builds
          WHERE patch = ${actualPatch}
            AND queue_id = 420
            AND role = ${normalizedRole}
            ${normalizedRegion ? Prisma.sql`AND region = ${normalizedRegion}` : Prisma.empty}
            AND rank_bracket = ${rankBracket}
          GROUP BY champion_id
        ) cib_count ON cib_count.champion_id = crp.champion_id
        LEFT JOIN (
          SELECT 
            champion_id,
            COUNT(DISTINCT spell1_id || '-' || spell2_id)::bigint as spell_sets
          FROM champion_spell_sets
          WHERE patch = ${actualPatch}
            AND queue_id = 420
            AND role = ${normalizedRole}
            ${normalizedRegion ? Prisma.sql`AND region = ${normalizedRegion}` : Prisma.empty}
            AND rank_bracket = ${rankBracket}
          GROUP BY champion_id
        ) css_count ON css_count.champion_id = crp.champion_id
        WHERE crp.patch = ${actualPatch}
          AND crp.queue_id = 420
          AND crp.role = ${normalizedRole}
          ${normalizedRegion ? Prisma.sql`AND crp.region = ${normalizedRegion}` : Prisma.empty}
          AND crp.rank_bracket = ${rankBracket}
        GROUP BY crp.champion_id
        HAVING COUNT(DISTINCT crp.primary_style_id || '-' || crp.sub_style_id) > 0
        ORDER BY rune_pages DESC, item_builds DESC
        LIMIT 50
      `;

      // Fetch champion names from Data Dragon
      let championNameMap: Record<number, string> = {};
      try {
        const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions: string[] = await versionResponse.json();
        const latestVersion = versions[0] || '14.1.1';
        
        const championResponse = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
        );
        const championData: any = await championResponse.json();
        
        // Map champion IDs to names
        Object.values(championData.data || {}).forEach((champ: any) => {
          const championId = parseInt(champ.key, 10);
          if (!isNaN(championId)) {
            championNameMap[championId] = champ.name;
          }
        });
      } catch (error) {
        console.error('[AnalyticsController] Failed to fetch champion names:', error);
      }

      return {
        champions: championsWithRunes.map((c) => ({
          championId: Number(c.champion_id),
          championName: championNameMap[Number(c.champion_id)] || `Champion ${c.champion_id}`,
          runePages: Number(c.rune_pages),
          itemBuilds: Number(c.item_builds),
          spellSets: Number(c.spell_sets),
        })),
        patch: actualPatch,
        rank: rankBracket,
        role: normalizedRole,
        region: normalizedRegion || 'world',
      };
    } catch (error) {
      console.error('[AnalyticsController] Error getting champions with builds:', error);
      return {
        champions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
   * Supports both GET and POST for convenience
   */
  @Get('aggregate')
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

      // Get build archetypes (correlated runes + items + spells)
      const buildArchetypes = await this.buildAggregationService.getBuildArchetypes(
        champId,
        actualPatch,
        rankBracket,
        normalizedRole,
        normalizedRegion,
        5 // Get top 5 build archetypes
      );

      // If no archetypes found, fall back to separate builds
      if (buildArchetypes.length === 0) {
        const [runes, spells, items] = await Promise.all([
          this.buildAggregationService.getRecommendedRunes(
            champId,
            actualPatch,
            rankBracket,
            normalizedRole,
            normalizedRegion,
            1
          ),
          this.buildAggregationService.getRecommendedSpells(
            champId,
            actualPatch,
            rankBracket,
            normalizedRole,
            normalizedRegion,
            1
          ),
          this.buildAggregationService.getRecommendedItems(
            champId,
            actualPatch,
            rankBracket,
            normalizedRole,
            normalizedRegion,
            1
          ),
        ]);

        return {
          championId: champId,
          patch: actualPatch,
          rank: rankBracket,
          role: normalizedRole,
          region: normalizedRegion || 'world',
          tierStats: championStats || null,
          builds: runes.length > 0 && items.length > 0 ? [{
            archetype: 'Recommended',
            runes: {
              primaryStyleId: runes[0].primaryStyleId,
              subStyleId: runes[0].subStyleId,
              perkIds: runes[0].perkIds,
              statShards: runes[0].statShards,
              winRate: runes[0].winRate * 100,
              games: runes[0].games,
            },
            spells: spells.length > 0 ? {
              spell1Id: spells[0].spell1Id,
              spell2Id: spells[0].spell2Id,
              winRate: spells[0].winRate * 100,
              games: spells[0].games,
            } : null,
            items: {
              items: items[0].items,
              winRate: items[0].winRate * 100,
              games: items[0].games,
            },
            totalGames: Math.min(runes[0].games, items[0].games),
            overallWinRate: (runes[0].winRate + items[0].winRate) / 2 * 100,
          }] : [],
        };
      }

      return {
        championId: champId,
        patch: actualPatch,
        rank: rankBracket,
        role: normalizedRole,
        region: normalizedRegion || 'world',
        tierStats: championStats || null,
        builds: buildArchetypes.map(archetype => ({
          archetype: archetype.archetype,
          runes: {
            primaryStyleId: archetype.runes.primaryStyleId,
            subStyleId: archetype.runes.subStyleId,
            perkIds: archetype.runes.perkIds,
            statShards: archetype.runes.statShards,
            winRate: archetype.runes.winRate * 100,
            games: archetype.runes.games,
          },
          spells: {
            spell1Id: archetype.spells.spell1Id,
            spell2Id: archetype.spells.spell2Id,
            winRate: archetype.spells.winRate * 100,
            games: archetype.spells.games,
          },
          items: {
            items: archetype.items.items,
            winRate: archetype.items.winRate * 100,
            games: archetype.items.games,
          },
          totalGames: archetype.totalGames,
          overallWinRate: archetype.overallWinRate * 100,
        })),
      };
    } catch (error) {
      console.error('[AnalyticsController] Error getting champion build:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
