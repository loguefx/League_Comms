import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
import { BuildAggregationService } from './build-aggregation.service';
import { PublicChampionSeedService } from './public-champion-seed.service';
import { BatchSeedService } from './batch-seed.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Champions Analytics Controller
 * 
 * All endpoints respect frontend filters (patch, rank, role, region):
 * - patch: Specific patch (e.g., '16.3') or 'latest' for most recent
 * - rank: Rank bracket (e.g., 'EMERALD_PLUS', 'ALL_RANKS')
 * - role: Role (e.g., 'TOP', 'MIDDLE', 'ALL')
 * - region: Region (e.g., 'na1', 'euw1') or 'world' for all regions
 * 
 * No hardcoded defaults - all values come from frontend filters.
 */
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
        console.log(`[AnalyticsController] getChampionsWithBuilds - Resolved "latest" to patch: ${actualPatch}`);
        if (!actualPatch) {
          return {
            champions: [],
            message: 'No patch data available',
          };
        }
      }
      console.log(`[AnalyticsController] getChampionsWithBuilds - Using patch: ${actualPatch}`);

      // Normalize rank bracket (handle ALL_RANKS -> all_ranks)
      const rankInput = rank || 'ALL_RANKS';
      const normalizedRank = !rankInput || rankInput === 'ALL_RANKS' 
        ? 'all_ranks' 
        : rankInput.toLowerCase().trim().replace(/_plus$/, '');
      const isAllRanks = normalizedRank === 'all_ranks';
      const normalizedRole = role === 'ALL' || !role ? 'ALL' : role;
      const normalizedRegion = region === 'world' || !region ? null : region;

      console.log(`[AnalyticsController] getChampionsWithBuilds - patch=${actualPatch}, rank=${rank} -> ${normalizedRank}, role=${role} -> ${normalizedRole}, region=${region} -> ${normalizedRegion}, isAllRanks=${isAllRanks}`);

      // Query champions that have rune pages (indicating build data exists)
      // Handle "all_ranks" by aggregating across all rank brackets
      const championsWithRunes = isAllRanks
        ? await this.prisma.$queryRaw<Array<{
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
              GROUP BY champion_id
            ) css_count ON css_count.champion_id = crp.champion_id
            WHERE crp.patch = ${actualPatch}
              AND crp.queue_id = 420
              AND crp.role = ${normalizedRole}
              ${normalizedRegion ? Prisma.sql`AND crp.region = ${normalizedRegion}` : Prisma.empty}
            GROUP BY crp.champion_id
            HAVING COUNT(DISTINCT crp.primary_style_id || '-' || crp.sub_style_id) > 0
            ORDER BY rune_pages DESC, item_builds DESC
            LIMIT 50
          `
        : await this.prisma.$queryRaw<Array<{
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
                AND rank_bracket = ${normalizedRank}
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
                AND rank_bracket = ${normalizedRank}
              GROUP BY champion_id
            ) css_count ON css_count.champion_id = crp.champion_id
            WHERE crp.patch = ${actualPatch}
              AND crp.queue_id = 420
              AND crp.role = ${normalizedRole}
              ${normalizedRegion ? Prisma.sql`AND crp.region = ${normalizedRegion}` : Prisma.empty}
              AND crp.rank_bracket = ${normalizedRank}
            GROUP BY crp.champion_id
            HAVING COUNT(DISTINCT crp.primary_style_id || '-' || crp.sub_style_id) > 0
            ORDER BY rune_pages DESC, item_builds DESC
            LIMIT 50
          `;

      console.log(`[AnalyticsController] Found ${championsWithRunes.length} champions with build data`);

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
        rank: normalizedRank,
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

      // Get latest patch if 'latest' or not provided - use provided values, no hardcoded defaults
      let actualPatch: string | null = null;
      if (!patch || patch === 'latest') {
        const patches = await this.analyticsService.getAvailablePatches();
        actualPatch = patches.latest || null;
        if (!actualPatch) {
          return {
            error: 'No patch data available. Please ensure matches have been ingested and aggregated.',
          };
        }
      } else {
        actualPatch = patch;
      }

      // Normalize rank bracket - use provided value or default to ALL_RANKS (which becomes 'all_ranks')
      const rankInput = rank || 'ALL_RANKS';
      const rankBracket = !rankInput || rankInput === 'ALL_RANKS' 
        ? 'all_ranks' 
        : rankInput.toLowerCase().trim().replace(/_plus$/, '');
      const normalizedRole = role || 'ALL';
      const normalizedRegion = region === 'world' || !region ? null : region;

      // Get tier stats for this champion
      const tierStats = await this.analyticsService.getChampionStats({
        rank: rankBracket,
        role: normalizedRole,
        patch: actualPatch,
        region: normalizedRegion,
      });
      const foundStats = tierStats.find((s: any) => s.championId === champId);
      // Sanitize championStats to ensure no BigInt values
      const championStats = foundStats ? {
        championId: Number(foundStats.championId),
        games: Number(foundStats.games),
        wins: Number(foundStats.wins),
        winRate: Number(foundStats.winRate),
        pickRate: Number(foundStats.pickRate),
        banRate: Number(foundStats.banRate),
      } : null;

      // Get all item builds (starting, core, fourth, fifth, sixth)
      const allItemBuilds = await this.buildAggregationService.getAllItemBuilds(
        champId,
        actualPatch,
        rankBracket,
        normalizedRole,
        normalizedRegion
      );
      
      // Log item build counts for debugging (sanitize BigInt before logging)
      console.log(`[getChampionBuild] ========== ITEM BUILDS DEBUG ==========`);
      console.log(`[getChampionBuild] Champion ID: ${champId}, Patch: ${actualPatch}, Rank: ${rankBracket}, Role: ${normalizedRole}, Region: ${normalizedRegion || 'world'}`);
      console.log(`[getChampionBuild] Item builds counts:`, {
        starting: allItemBuilds.starting.length,
        core: allItemBuilds.core.length,
        fourth: allItemBuilds.fourth.length,
        fifth: allItemBuilds.fifth.length,
        sixth: allItemBuilds.sixth.length,
      });
      // Sanitize BigInt before JSON.stringify to prevent serialization errors
      const sanitizeForLog = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return Number(obj);
        if (Array.isArray(obj)) return obj.map(sanitizeForLog);
        if (typeof obj === 'object') {
          const sanitized: any = {};
          for (const key in obj) {
            sanitized[key] = sanitizeForLog(obj[key]);
          }
          return sanitized;
        }
        return obj;
      };
      try {
        console.log(`[getChampionBuild] Starting items data:`, JSON.stringify(sanitizeForLog(allItemBuilds.starting), null, 2));
        console.log(`[getChampionBuild] Core items data:`, JSON.stringify(sanitizeForLog(allItemBuilds.core), null, 2));
        console.log(`[getChampionBuild] Fourth items data:`, JSON.stringify(sanitizeForLog(allItemBuilds.fourth), null, 2));
        console.log(`[getChampionBuild] Fifth items data:`, JSON.stringify(sanitizeForLog(allItemBuilds.fifth), null, 2));
        console.log(`[getChampionBuild] Sixth items data:`, JSON.stringify(sanitizeForLog(allItemBuilds.sixth), null, 2));
      } catch (logError) {
        console.warn(`[getChampionBuild] Failed to log item builds data:`, logError);
      }
      console.log(`[getChampionBuild] ======================================`);

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
          itemBuilds: {
            starting: allItemBuilds.starting.map(ib => ({
              items: ib.items,
              winRate: Number(ib.winRate) * 100,
              games: Number(ib.games),
            })),
            core: allItemBuilds.core.map(ib => ({
              items: ib.items,
              winRate: Number(ib.winRate) * 100,
              games: Number(ib.games),
            })),
            fourth: allItemBuilds.fourth.map(ib => ({
              items: ib.items,
              winRate: Number(ib.winRate) * 100,
              games: Number(ib.games),
            })),
            fifth: allItemBuilds.fifth.map(ib => ({
              items: ib.items,
              winRate: Number(ib.winRate) * 100,
              games: Number(ib.games),
            })),
            sixth: allItemBuilds.sixth.map(ib => ({
              items: ib.items,
              winRate: Number(ib.winRate) * 100,
              games: Number(ib.games),
            })),
          },
          builds: runes.length > 0 && items.length > 0 ? [{
            archetype: 'Recommended',
            runes: {
              primaryStyleId: Number(runes[0].primaryStyleId),
              subStyleId: Number(runes[0].subStyleId),
              perkIds: runes[0].perkIds.map(id => Number(id)),
              statShards: runes[0].statShards.map(id => Number(id)),
              winRate: Number(runes[0].winRate) * 100,
              games: Number(runes[0].games),
            },
            spells: spells.length > 0 ? {
              spell1Id: Number(spells[0].spell1Id),
              spell2Id: Number(spells[0].spell2Id),
              winRate: Number(spells[0].winRate) * 100,
              games: Number(spells[0].games),
            } : null,
            items: {
              items: items[0].items.map(id => Number(id)),
              winRate: Number(items[0].winRate) * 100,
              games: Number(items[0].games),
            },
            totalGames: Number(Math.min(Number(runes[0].games), Number(items[0].games))),
            overallWinRate: Number((Number(runes[0].winRate) + Number(items[0].winRate)) / 2 * 100),
          }] : [],
        };
      }

      // Ensure championStats is properly sanitized (convert any BigInt values)
      const sanitizedTierStats = championStats ? {
        championId: Number(championStats.championId) || 0,
        games: Number(championStats.games) || 0,
        wins: Number(championStats.wins) || 0,
        winRate: Number(championStats.winRate) || 0,
        pickRate: Number(championStats.pickRate) || 0,
        banRate: Number(championStats.banRate) || 0,
        counterPicks: Array.isArray((championStats as any).counterPicks)
          ? (championStats as any).counterPicks.map((id: any) => Number(id) || 0).filter((id: number) => id > 0)
          : [],
      } : null;

      // Build the response object
      const responseData = {
        championId: champId,
        patch: actualPatch,
        rank: rankBracket,
        role: normalizedRole,
        region: normalizedRegion || 'world',
        tierStats: sanitizedTierStats,
        itemBuilds: {
          starting: allItemBuilds.starting.map(ib => ({
            items: ib.items.map(id => Number(id)),
            winRate: Number(ib.winRate) * 100,
            games: Number(ib.games),
          })),
          core: allItemBuilds.core.map(ib => ({
            items: ib.items.map(id => Number(id)),
            winRate: Number(ib.winRate) * 100,
            games: Number(ib.games),
          })),
          fourth: allItemBuilds.fourth.map(ib => ({
            items: ib.items.map(id => Number(id)),
            winRate: Number(ib.winRate) * 100,
            games: Number(ib.games),
          })),
          fifth: allItemBuilds.fifth.map(ib => ({
            items: ib.items.map(id => Number(id)),
            winRate: Number(ib.winRate) * 100,
            games: Number(ib.games),
          })),
          sixth: allItemBuilds.sixth.map(ib => ({
            items: ib.items.map(id => Number(id)),
            winRate: Number(ib.winRate) * 100,
            games: Number(ib.games),
          })),
        },
        builds: buildArchetypes.map(archetype => ({
          archetype: archetype.archetype,
          runes: {
            primaryStyleId: Number(archetype.runes.primaryStyleId),
            subStyleId: Number(archetype.runes.subStyleId),
            perkIds: archetype.runes.perkIds.map(id => Number(id)),
            statShards: archetype.runes.statShards.map(id => Number(id)),
            winRate: Number(archetype.runes.winRate) * 100,
            games: Number(archetype.runes.games),
          },
          spells: {
            spell1Id: Number(archetype.spells.spell1Id),
            spell2Id: Number(archetype.spells.spell2Id),
            winRate: Number(archetype.spells.winRate) * 100,
            games: Number(archetype.spells.games),
          },
          items: {
            items: archetype.items.items.map(id => Number(id)),
            winRate: Number(archetype.items.winRate) * 100,
            games: Number(archetype.items.games),
          },
          totalGames: Number(archetype.totalGames),
          overallWinRate: Number(archetype.overallWinRate) * 100,
        })),
      };

      // Final sanitization pass - recursively convert any remaining BigInt values
      const sanitizeBigInt = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return obj;
        }
        if (typeof obj === 'bigint') {
          console.warn(`[getChampionBuild] Found BigInt in final sanitization, converting to number`);
          return Number(obj);
        }
        if (Array.isArray(obj)) {
          return obj.map(item => sanitizeBigInt(item));
        }
        if (typeof obj === 'object') {
          const sanitized: any = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              sanitized[key] = sanitizeBigInt(obj[key]);
            }
          }
          return sanitized;
        }
        return obj;
      };

      // Test serialization before returning with multiple passes
      let finalResponse = sanitizeBigInt(responseData);
      
      // Try serialization multiple times to catch any remaining BigInt values
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Use a replacer function to catch BigInt during stringify
          JSON.stringify(finalResponse, (key, value) => {
            if (typeof value === 'bigint') {
              console.warn(`[getChampionBuild] Found BigInt at path: ${key} during stringify attempt ${attempt + 1}, converting to number`);
              return Number(value);
            }
            return value;
          });
          // If we get here, serialization succeeded
          console.log(`[getChampionBuild] ✅ Successfully serialized response after ${attempt + 1} attempt(s)`);
          return finalResponse;
        } catch (serializeError: any) {
          console.error(`[getChampionBuild] ❌ Serialization attempt ${attempt + 1} failed:`, serializeError.message);
          if (serializeError.message && serializeError.message.includes('BigInt')) {
            // Re-sanitize and try again
            finalResponse = sanitizeBigInt(finalResponse);
            if (attempt === 2) {
              // Last attempt failed, log detailed info
              console.error(`[getChampionBuild] ❌ All serialization attempts failed`);
              console.error(`[getChampionBuild] Response data keys:`, Object.keys(finalResponse));
              console.error(`[getChampionBuild] Response data sample:`, JSON.stringify(finalResponse).substring(0, 1000));
            }
          } else {
            // Not a BigInt error, break out
            break;
          }
        }
      }
      
      // If we get here, all attempts failed - return sanitized version anyway
      // The interceptor will handle it, but log a warning
      console.warn(`[getChampionBuild] ⚠️ Returning response after failed serialization attempts - interceptor will handle it`);
      return finalResponse;
    } catch (error: any) {
      console.error('[AnalyticsController] Error getting champion build:', error);
      
      // If it's a BigInt serialization error, return a safe fallback response
      if (error.message && (error.message.includes('BigInt') || error.message.includes('serialize'))) {
        console.error(`[getChampionBuild] BigInt serialization error detected for champion ${championId}`);
        console.error(`[getChampionBuild] Error details:`, error.message);
        
        // Return a minimal safe response that won't cause serialization errors
        return {
          championId: Number(championId) || 0,
          patch: patch || 'latest',
          rank: rank || 'ALL_RANKS',
          role: role || 'ALL',
          region: region || 'world',
          tierStats: null,
          itemBuilds: {
            starting: [],
            core: [],
            fourth: [],
            fifth: [],
            sixth: [],
          },
          builds: [],
          error: 'Data serialization error - some data could not be processed. Please try again or contact support.',
        };
      }
      
      // For other errors, return error message
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
