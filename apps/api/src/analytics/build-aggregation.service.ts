import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Service to aggregate build data (runes, spells, items) into recommendations
 * Similar to how U.GG computes "Recommended Runes" and "Core Items"
 */
@Injectable()
export class BuildAggregationService {
  private readonly logger = new Logger(BuildAggregationService.name);
  private readonly MIN_GAMES_THRESHOLD = 10; // Minimum games for a build to be recommended (lowered for initial data)
  private readonly SMOOTHING_K = 200; // Bayesian smoothing constant

  constructor(private prisma: PrismaService) {}

  /**
   * Aggregate all build data for a patch
   * Called after match ingestion or periodically
   */
  async aggregateBuilds(patch?: string): Promise<void> {
    this.logger.log(`Starting build aggregation${patch ? ` for patch ${patch}` : ''}...`);

    try {
      // Get patches to process
      const patches = patch
        ? [patch]
        : await this.prisma.$queryRaw<Array<{ patch: string }>>`
            SELECT DISTINCT patch
            FROM matches
            WHERE patch IS NOT NULL
          `.then((results) => results.map((r) => r.patch));

      if (patches.length === 0) {
        this.logger.warn('No patches found in database for build aggregation');
        return;
      }

      this.logger.log(`Processing ${patches.length} patch(es) for build aggregation: ${patches.join(', ')}`);

      for (const p of patches) {
        this.logger.log(`Aggregating builds for patch ${p}...`);
        try {
          await this.aggregateRunePages(p);
          await this.aggregateSpellSets(p);
          await this.aggregateItemBuilds(p);
          this.logger.log(`✓ Build aggregation complete for patch ${p}`);
        } catch (error) {
          this.logger.error(`✗ Build aggregation failed for patch ${p}:`, error);
          // Continue with next patch even if one fails
        }
      }

      // Log summary of aggregated build data
      const [runePageCount, itemBuildCount, spellSetCount] = await Promise.all([
        this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint as count FROM champion_rune_pages
        `,
        this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint as count FROM champion_item_builds
        `,
        this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint as count FROM champion_spell_sets
        `,
      ]);

      this.logger.log(`Build aggregation complete. Total aggregated: ${Number(runePageCount[0]?.count || 0)} rune pages, ${Number(itemBuildCount[0]?.count || 0)} item builds, ${Number(spellSetCount[0]?.count || 0)} spell sets`);
    } catch (error) {
      this.logger.error('Build aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Aggregate rune pages (perks) into recommendations
   */
  private async aggregateRunePages(patch: string): Promise<void> {
    this.logger.log(`Aggregating rune pages for patch ${patch}...`);
    
    // Check if we have any participant_perks data
    const perkCount = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM participant_perks pp
      JOIN matches m ON m.match_id = pp.match_id
      WHERE m.patch = ${patch} AND m.queue_id = 420
    `;
    this.logger.log(`Found ${Number(perkCount[0]?.count || 0)} participant perks for patch ${patch}`);

    // Group by: patch, region, queueId, rankBracket, role, championId, rune page signature
    // Use DISTINCT ON to pick the most common perk_ids/stat_shards for each primary key
    await this.prisma.$executeRaw`
      WITH rune_aggregates AS (
        SELECT
          m.patch,
          m.region,
          m.queue_id,
          m.rank_bracket,
          pp.role,
          pp.champion_id,
          pp.primary_style_id,
          pp.sub_style_id,
          pp.perk_ids,
          pp.stat_shards,
          COUNT(*)::bigint AS games,
          SUM(CASE WHEN pp.win THEN 1 ELSE 0 END)::bigint AS wins
        FROM participant_perks pp
        JOIN matches m ON m.match_id = pp.match_id
        WHERE m.patch = ${patch}
          AND m.queue_id = 420
        GROUP BY
          m.patch, m.region, m.queue_id, m.rank_bracket,
          pp.role, pp.champion_id,
          pp.primary_style_id, pp.sub_style_id, pp.perk_ids, pp.stat_shards
      ),
      ranked_runes AS (
        SELECT *,
          ROW_NUMBER() OVER (
            PARTITION BY patch, region, queue_id, rank_bracket, role, champion_id, primary_style_id, sub_style_id
            ORDER BY games DESC
          ) as rn
        FROM rune_aggregates
      )
      INSERT INTO champion_rune_pages (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id, perk_ids, stat_shards,
        games, wins, updated_at
      )
      SELECT
        patch,
        region,
        queue_id,
        rank_bracket,
        role,
        champion_id,
        primary_style_id,
        sub_style_id,
        perk_ids,
        stat_shards,
        games,
        wins,
        NOW() AS updated_at
      FROM ranked_runes
      WHERE rn = 1
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id
      )
      DO UPDATE SET
        perk_ids = EXCLUDED.perk_ids,
        stat_shards = EXCLUDED.stat_shards,
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    // Also aggregate "ALL" role (aggregate across all roles)
    await this.prisma.$executeRaw`
      WITH rune_aggregates_all AS (
        SELECT
          m.patch,
          m.region,
          m.queue_id,
          m.rank_bracket,
          'ALL' AS role,
          pp.champion_id,
          pp.primary_style_id,
          pp.sub_style_id,
          pp.perk_ids,
          pp.stat_shards,
          COUNT(*)::bigint AS games,
          SUM(CASE WHEN pp.win THEN 1 ELSE 0 END)::bigint AS wins
        FROM participant_perks pp
        JOIN matches m ON m.match_id = pp.match_id
        WHERE m.patch = ${patch}
          AND m.queue_id = 420
        GROUP BY
          m.patch, m.region, m.queue_id, m.rank_bracket,
          pp.champion_id,
          pp.primary_style_id, pp.sub_style_id, pp.perk_ids, pp.stat_shards
      ),
      ranked_runes_all AS (
        SELECT *,
          ROW_NUMBER() OVER (
            PARTITION BY patch, region, queue_id, rank_bracket, role, champion_id, primary_style_id, sub_style_id
            ORDER BY games DESC
          ) as rn
        FROM rune_aggregates_all
      )
      INSERT INTO champion_rune_pages (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id, perk_ids, stat_shards,
        games, wins, updated_at
      )
      SELECT
        patch,
        region,
        queue_id,
        rank_bracket,
        role,
        champion_id,
        primary_style_id,
        sub_style_id,
        perk_ids,
        stat_shards,
        games,
        wins,
        NOW() AS updated_at
      FROM ranked_runes_all
      WHERE rn = 1
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id
      )
      DO UPDATE SET
        perk_ids = EXCLUDED.perk_ids,
        stat_shards = EXCLUDED.stat_shards,
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    // Check how many rune pages were created
    const runePageCount = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM champion_rune_pages
      WHERE patch = ${patch}
    `;
    this.logger.log(`Rune pages aggregated for patch ${patch}: ${Number(runePageCount[0]?.count || 0)} total rune pages`);
  }

  /**
   * Aggregate spell sets into recommendations
   */
  private async aggregateSpellSets(patch: string): Promise<void> {
    this.logger.log(`Aggregating spell sets for patch ${patch}...`);

    // Normalize spell order (always store lower ID first for consistency)
    await this.prisma.$executeRaw`
      INSERT INTO champion_spell_sets (
        patch, region, queue_id, rank_bracket, role, champion_id,
        spell1_id, spell2_id, games, wins, updated_at
      )
      SELECT
        m.patch,
        m.region,
        m.queue_id,
        m.rank_bracket,
        ps.role,
        ps.champion_id,
        LEAST(ps.spell1_id, ps.spell2_id) AS spell1_id,
        GREATEST(ps.spell1_id, ps.spell2_id) AS spell2_id,
        COUNT(*)::bigint AS games,
        SUM(CASE WHEN ps.win THEN 1 ELSE 0 END)::bigint AS wins,
        NOW() AS updated_at
      FROM participant_spells ps
      JOIN matches m ON m.match_id = ps.match_id
      WHERE m.patch = ${patch}
        AND m.queue_id = 420
      GROUP BY
        m.patch, m.region, m.queue_id, m.rank_bracket,
        ps.role, ps.champion_id,
        LEAST(ps.spell1_id, ps.spell2_id),
        GREATEST(ps.spell1_id, ps.spell2_id)
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id,
        spell1_id, spell2_id
      )
      DO UPDATE SET
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    // Also aggregate "ALL" role
    await this.prisma.$executeRaw`
      INSERT INTO champion_spell_sets (
        patch, region, queue_id, rank_bracket, role, champion_id,
        spell1_id, spell2_id, games, wins, updated_at
      )
      SELECT
        m.patch,
        m.region,
        m.queue_id,
        m.rank_bracket,
        'ALL' AS role,
        ps.champion_id,
        LEAST(ps.spell1_id, ps.spell2_id) AS spell1_id,
        GREATEST(ps.spell1_id, ps.spell2_id) AS spell2_id,
        COUNT(*)::bigint AS games,
        SUM(CASE WHEN ps.win THEN 1 ELSE 0 END)::bigint AS wins,
        NOW() AS updated_at
      FROM participant_spells ps
      JOIN matches m ON m.match_id = ps.match_id
      WHERE m.patch = ${patch}
        AND m.queue_id = 420
      GROUP BY
        m.patch, m.region, m.queue_id, m.rank_bracket,
        ps.champion_id,
        LEAST(ps.spell1_id, ps.spell2_id),
        GREATEST(ps.spell1_id, ps.spell2_id)
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id,
        spell1_id, spell2_id
      )
      DO UPDATE SET
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    this.logger.log(`Spell sets aggregated for patch ${patch}`);
  }

  /**
   * Aggregate item builds into recommendations
   * Computes starting items (item0-item1), core items (item2-item4), and later items (item5-item6)
   * Note: Without timeline data, we approximate by position in the final items array
   */
  private async aggregateItemBuilds(patch: string): Promise<void> {
    this.logger.log(`Aggregating item builds for patch ${patch}...`);

    // Extract items by position in the array (PostgreSQL arrays are 1-indexed)
    // Starting items: items[1:2] (first 2 items)
    // Core items: items[3:5] (next 3 items)
    // Fourth item: items[6] (if exists)
    // Fifth item: items[7] (if exists)
    // Sixth item: items[8] (if exists, though rare)
    
    // Helper function to aggregate items at specific array positions
    // PostgreSQL arrays are 1-indexed, so items[1] is the first item
    const aggregateByPosition = async (
      buildType: string,
      startPos: number,
      endPos: number | null,
      expectedCount: number,
      roleFilter: string | null = null
    ) => {
      // For single item (fourth, fifth, sixth), extract that position
      // For multiple items (starting, core), extract the slice
      if (endPos === null) {
        // Single item at position startPos
        await this.prisma.$executeRaw`
          WITH item_at_position AS (
            SELECT
              m.patch,
              m.region,
              m.queue_id,
              m.rank_bracket,
              pfi.role,
              pfi.champion_id,
              pfi.items[${startPos}] AS item_id,
              COUNT(*)::bigint AS frequency
            FROM participant_final_items pfi
            JOIN matches m ON m.match_id = pfi.match_id
            WHERE m.patch = ${patch}
              AND m.queue_id = 420
              AND pfi.win = true
              AND array_length(pfi.items, 1) >= ${startPos}
              AND pfi.items[${startPos}] > 0
              ${roleFilter ? Prisma.sql`AND pfi.role = ${roleFilter}` : Prisma.empty}
            GROUP BY
              m.patch, m.region, m.queue_id, m.rank_bracket,
              pfi.role, pfi.champion_id, pfi.items[${startPos}]
          ),
          ranked_items AS (
            SELECT *,
              ROW_NUMBER() OVER (
                PARTITION BY patch, region, queue_id, rank_bracket, role, champion_id 
                ORDER BY frequency DESC
              ) AS rn
            FROM item_at_position
          )
          INSERT INTO champion_item_builds (
            patch, region, queue_id, rank_bracket, role, champion_id,
            build_type, items, games, wins, updated_at
          )
          SELECT
            patch,
            region,
            queue_id,
            rank_bracket,
            role,
            champion_id,
            ${buildType} AS build_type,
            ARRAY[item_id] AS items,
            frequency AS games,
            frequency AS wins, -- All are from winning games
            NOW() AS updated_at
          FROM ranked_items
          WHERE rn <= 5
          ON CONFLICT (
            patch, region, queue_id, rank_bracket, role, champion_id, build_type
          )
          DO UPDATE SET
            items = EXCLUDED.items,
            games = EXCLUDED.games,
            wins = EXCLUDED.wins,
            updated_at = NOW()
        `;
      } else {
        // Multiple items: extract slice and aggregate combinations
        await this.prisma.$executeRaw`
          WITH item_combinations AS (
            SELECT
              m.patch,
              m.region,
              m.queue_id,
              m.rank_bracket,
              pfi.role,
              pfi.champion_id,
              (pfi.items[${startPos}:${endPos}])::int[] AS item_slice,
              COUNT(*)::bigint AS frequency,
              SUM(CASE WHEN pfi.win THEN 1 ELSE 0 END)::bigint AS wins
            FROM participant_final_items pfi
            JOIN matches m ON m.match_id = pfi.match_id
            WHERE m.patch = ${patch}
              AND m.queue_id = 420
              AND array_length(pfi.items, 1) >= ${endPos}
              AND array_length((pfi.items[${startPos}:${endPos}])::int[], 1) = ${expectedCount}
              AND (pfi.items[${startPos}:${endPos}])::int[] IS NOT NULL
              ${roleFilter ? Prisma.sql`AND pfi.role = ${roleFilter}` : Prisma.empty}
            GROUP BY
              m.patch, m.region, m.queue_id, m.rank_bracket,
              pfi.role, pfi.champion_id, (pfi.items[${startPos}:${endPos}])::int[]
          ),
          ranked_combinations AS (
            SELECT *,
              ROW_NUMBER() OVER (
                PARTITION BY patch, region, queue_id, rank_bracket, role, champion_id 
                ORDER BY frequency DESC
              ) AS rn
            FROM item_combinations
          )
          INSERT INTO champion_item_builds (
            patch, region, queue_id, rank_bracket, role, champion_id,
            build_type, items, games, wins, updated_at
          )
          SELECT
            patch,
            region,
            queue_id,
            rank_bracket,
            role,
            champion_id,
            ${buildType} AS build_type,
            item_slice AS items,
            frequency AS games,
            wins,
            NOW() AS updated_at
          FROM ranked_combinations
          WHERE rn <= 5
          ON CONFLICT (
            patch, region, queue_id, rank_bracket, role, champion_id, build_type
          )
          DO UPDATE SET
            items = EXCLUDED.items,
            games = EXCLUDED.games,
            wins = EXCLUDED.wins,
            updated_at = NOW()
        `;
      }
    };

    // Aggregate all build types for each role
    const roles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', null]; // null = ALL
    
    for (const role of roles) {
      try {
        // Starting items: items[1:2] (first 2 items)
        this.logger.log(`Aggregating starting items for patch ${patch}, role: ${role || 'ALL'}`);
        await aggregateByPosition('starting', 1, 2, 2, role);
        
        // Core items: items[3:5] (next 3 items)
        this.logger.log(`Aggregating core items for patch ${patch}, role: ${role || 'ALL'}`);
        await aggregateByPosition('core', 3, 5, 3, role);
        
        // Fourth item: items[6] (if exists)
        this.logger.log(`Aggregating fourth items for patch ${patch}, role: ${role || 'ALL'}`);
        await aggregateByPosition('fourth', 6, null, 1, role);
        
        // Fifth item: items[7] (if exists)
        this.logger.log(`Aggregating fifth items for patch ${patch}, role: ${role || 'ALL'}`);
        await aggregateByPosition('fifth', 7, null, 1, role);
        
        // Sixth item: items[8] (if exists)
        this.logger.log(`Aggregating sixth items for patch ${patch}, role: ${role || 'ALL'}`);
        await aggregateByPosition('sixth', 8, null, 1, role);
      } catch (error) {
        this.logger.error(`Failed to aggregate item builds for role ${role || 'ALL'}:`, error);
      }
    }

    // Log summary of aggregated items
    const summary = await this.prisma.$queryRaw<Array<{
      build_type: string;
      role: string;
      count: bigint;
    }>>`
      SELECT build_type, role, COUNT(*)::bigint as count
      FROM champion_item_builds
      WHERE patch = ${patch}
      GROUP BY build_type, role
      ORDER BY build_type, role
    `;
    
    this.logger.log(`Item builds aggregated for patch ${patch}:`, summary);
    this.logger.log(`Item builds aggregated for patch ${patch} (all build types)`);
  }

  /**
   * Get recommended rune pages for a champion
   * Returns the most common rune page (recommended) + top alternatives
   */
  async getRecommendedRunes(
    championId: number,
    patch: string,
    rankBracket: string,
    role: string,
    region: string | null,
    limit: number = 5
  ): Promise<Array<{
    primaryStyleId: number;
    subStyleId: number;
    perkIds: number[];
    statShards: number[];
    winRate: number;
    games: number;
  }>> {
    const normalizedRole = role === 'ALL' || !role ? 'ALL' : role;
    const isAllRanks = rankBracket === 'all_ranks';
    const isWorld = !region;

    this.logger.log(`[getRecommendedRunes] Querying for championId=${championId}, patch=${patch}, rankBracket=${rankBracket}, role=${normalizedRole}, region=${region || 'world'}`);

    // First, check if any data exists at all for this champion
    const totalRunePages = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM champion_rune_pages
      WHERE champion_id = ${championId}
    `;
    this.logger.log(`[getRecommendedRunes] Total rune pages for champion ${championId}: ${Number(totalRunePages[0]?.count || 0)}`);

    let runePages;
    if (isAllRanks && isWorld) {
      runePages = await this.prisma.$queryRaw<Array<{
        primary_style_id: number;
        sub_style_id: number;
        perk_ids: number[];
        stat_shards: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          primary_style_id,
          sub_style_id,
          perk_ids,
          stat_shards,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_rune_pages
        WHERE patch = ${patch}
          AND queue_id = 420
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY primary_style_id, sub_style_id, perk_ids, stat_shards
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
      
      // If no results with threshold, try without threshold
      if (runePages.length === 0) {
        this.logger.warn(`[getRecommendedRunes] No rune pages found with threshold ${this.MIN_GAMES_THRESHOLD}, trying without threshold...`);
        runePages = await this.prisma.$queryRaw<Array<{
          primary_style_id: number;
          sub_style_id: number;
          perk_ids: number[];
          stat_shards: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            primary_style_id,
            sub_style_id,
            perk_ids,
            stat_shards,
            SUM(games)::bigint AS games,
            SUM(wins)::bigint AS wins
          FROM champion_rune_pages
          WHERE patch = ${patch}
            AND queue_id = 420
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
          GROUP BY primary_style_id, sub_style_id, perk_ids, stat_shards
          ORDER BY SUM(games) DESC
          LIMIT ${limit}
        `;
      }
    } else if (isAllRanks) {
      runePages = await this.prisma.$queryRaw<Array<{
        primary_style_id: number;
        sub_style_id: number;
        perk_ids: number[];
        stat_shards: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          primary_style_id,
          sub_style_id,
          perk_ids,
          stat_shards,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_rune_pages
        WHERE patch = ${patch}
          AND region = ${region}
          AND queue_id = 420
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY primary_style_id, sub_style_id, perk_ids, stat_shards
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
      
      if (runePages.length === 0) {
        runePages = await this.prisma.$queryRaw<Array<{
          primary_style_id: number;
          sub_style_id: number;
          perk_ids: number[];
          stat_shards: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            primary_style_id,
            sub_style_id,
            perk_ids,
            stat_shards,
            SUM(games)::bigint AS games,
            SUM(wins)::bigint AS wins
          FROM champion_rune_pages
          WHERE patch = ${patch}
            AND region = ${region}
            AND queue_id = 420
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
          GROUP BY primary_style_id, sub_style_id, perk_ids, stat_shards
          ORDER BY SUM(games) DESC
          LIMIT ${limit}
        `;
      }
    } else if (isWorld) {
      runePages = await this.prisma.$queryRaw<Array<{
        primary_style_id: number;
        sub_style_id: number;
        perk_ids: number[];
        stat_shards: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          primary_style_id,
          sub_style_id,
          perk_ids,
          stat_shards,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_rune_pages
        WHERE patch = ${patch}
          AND queue_id = 420
          AND rank_bracket = ${rankBracket}
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY primary_style_id, sub_style_id, perk_ids, stat_shards
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
      
      if (runePages.length === 0) {
        runePages = await this.prisma.$queryRaw<Array<{
          primary_style_id: number;
          sub_style_id: number;
          perk_ids: number[];
          stat_shards: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            primary_style_id,
            sub_style_id,
            perk_ids,
            stat_shards,
            SUM(games)::bigint AS games,
            SUM(wins)::bigint AS wins
          FROM champion_rune_pages
          WHERE patch = ${patch}
            AND queue_id = 420
            AND rank_bracket = ${rankBracket}
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
          GROUP BY primary_style_id, sub_style_id, perk_ids, stat_shards
          ORDER BY SUM(games) DESC
          LIMIT ${limit}
        `;
      }
    } else {
      runePages = await this.prisma.$queryRaw<Array<{
        primary_style_id: number;
        sub_style_id: number;
        perk_ids: number[];
        stat_shards: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          primary_style_id,
          sub_style_id,
          perk_ids,
          stat_shards,
          games,
          wins
        FROM champion_rune_pages
        WHERE patch = ${patch}
          AND region = ${region}
          AND queue_id = 420
          AND rank_bracket = ${rankBracket}
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        ORDER BY games DESC
        LIMIT ${limit}
      `;
      
      if (runePages.length === 0) {
        runePages = await this.prisma.$queryRaw<Array<{
          primary_style_id: number;
          sub_style_id: number;
          perk_ids: number[];
          stat_shards: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            primary_style_id,
            sub_style_id,
            perk_ids,
            stat_shards,
            games,
            wins
          FROM champion_rune_pages
          WHERE patch = ${patch}
            AND region = ${region}
            AND queue_id = 420
            AND rank_bracket = ${rankBracket}
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
          ORDER BY games DESC
          LIMIT ${limit}
        `;
      }
    }

    this.logger.log(`[getRecommendedRunes] Found ${runePages.length} rune pages for champion ${championId}`);

    if (!runePages || runePages.length === 0) {
      this.logger.warn(`[getRecommendedRunes] No rune pages found for champion ${championId} with filters: patch=${patch}, role=${normalizedRole}, rank=${rankBracket}, region=${region || 'world'}`);
      return [];
    }

    return runePages.map((rp) => {
      const games = Number(rp.games);
      const wins = Number(rp.wins);
      const smoothedWinRate = (wins + this.SMOOTHING_K * 0.5) / (games + this.SMOOTHING_K);

      return {
        primaryStyleId: rp.primary_style_id,
        subStyleId: rp.sub_style_id,
        perkIds: rp.perk_ids,
        statShards: rp.stat_shards,
        winRate: smoothedWinRate,
        games,
      };
    });
  }

  /**
   * Get recommended spell sets for a champion
   * Returns the most common spell set (recommended) + top alternatives
   */
  async getRecommendedSpells(
    championId: number,
    patch: string,
    rankBracket: string,
    role: string,
    region: string | null,
    limit: number = 5
  ): Promise<Array<{
    spell1Id: number;
    spell2Id: number;
    winRate: number;
    games: number;
  }>> {
    const normalizedRole = role === 'ALL' || !role ? 'ALL' : role;
    const isAllRanks = rankBracket === 'all_ranks';
    const isWorld = !region;

    let spellSets;
    if (isAllRanks && isWorld) {
      spellSets = await this.prisma.$queryRaw<Array<{
        spell1_id: number;
        spell2_id: number;
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          spell1_id,
          spell2_id,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_spell_sets
        WHERE patch = ${patch}
          AND queue_id = 420
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY spell1_id, spell2_id
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
    } else if (isAllRanks) {
      spellSets = await this.prisma.$queryRaw<Array<{
        spell1_id: number;
        spell2_id: number;
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          spell1_id,
          spell2_id,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_spell_sets
        WHERE patch = ${patch}
          AND region = ${region}
          AND queue_id = 420
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY spell1_id, spell2_id
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
    } else if (isWorld) {
      spellSets = await this.prisma.$queryRaw<Array<{
        spell1_id: number;
        spell2_id: number;
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          spell1_id,
          spell2_id,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_spell_sets
        WHERE patch = ${patch}
          AND queue_id = 420
          AND rank_bracket = ${rankBracket}
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY spell1_id, spell2_id
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
    } else {
      spellSets = await this.prisma.$queryRaw<Array<{
        spell1_id: number;
        spell2_id: number;
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          spell1_id,
          spell2_id,
          games,
          wins
        FROM champion_spell_sets
        WHERE patch = ${patch}
          AND region = ${region}
          AND queue_id = 420
          AND rank_bracket = ${rankBracket}
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        ORDER BY games DESC
        LIMIT ${limit}
      `;
    }

    if (!spellSets || spellSets.length === 0) {
      return [];
    }

    return spellSets.map((ss) => {
      const games = Number(ss.games);
      const wins = Number(ss.wins);
      const smoothedWinRate = (wins + this.SMOOTHING_K * 0.5) / (games + this.SMOOTHING_K);

      return {
        spell1Id: ss.spell1_id,
        spell2Id: ss.spell2_id,
        winRate: smoothedWinRate,
        games,
      };
    });
  }

  /**
   * Get all item build types for a champion (starting, core, fourth, fifth, sixth)
   * Returns a structured object with all build types
   */
  async getAllItemBuilds(
    championId: number,
    patch: string,
    rankBracket: string,
    role: string,
    region: string | null
  ): Promise<{
    starting: Array<{ items: number[]; winRate: number; games: number }>;
    core: Array<{ items: number[]; winRate: number; games: number }>;
    fourth: Array<{ items: number[]; winRate: number; games: number }>;
    fifth: Array<{ items: number[]; winRate: number; games: number }>;
    sixth: Array<{ items: number[]; winRate: number; games: number }>;
  }> {
    const normalizedRole = role === 'ALL' || !role ? 'ALL' : role;
    const isAllRanks = rankBracket === 'all_ranks';
    const isWorld = !region;

    const buildTypes = ['starting', 'core', 'fourth', 'fifth', 'sixth'] as const;
    const result: {
      starting: Array<{ items: number[]; winRate: number; games: number }>;
      core: Array<{ items: number[]; winRate: number; games: number }>;
      fourth: Array<{ items: number[]; winRate: number; games: number }>;
      fifth: Array<{ items: number[]; winRate: number; games: number }>;
      sixth: Array<{ items: number[]; winRate: number; games: number }>;
    } = {
      starting: [],
      core: [],
      fourth: [],
      fifth: [],
      sixth: [],
    };

    for (const buildType of buildTypes) {
      let itemBuilds;
      if (isAllRanks && isWorld) {
        itemBuilds = await this.prisma.$queryRaw<Array<{
          items: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            items,
            SUM(games)::bigint AS games,
            SUM(wins)::bigint AS wins
          FROM champion_item_builds
          WHERE patch = ${patch}
            AND queue_id = 420
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
            AND build_type = ${buildType}
          GROUP BY items
          ORDER BY SUM(games) DESC
          LIMIT 5
        `;
      } else if (isAllRanks) {
        itemBuilds = await this.prisma.$queryRaw<Array<{
          items: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            items,
            SUM(games)::bigint AS games,
            SUM(wins)::bigint AS wins
          FROM champion_item_builds
          WHERE patch = ${patch}
            AND region = ${region}
            AND queue_id = 420
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
            AND build_type = ${buildType}
          GROUP BY items
          ORDER BY SUM(games) DESC
          LIMIT 5
        `;
      } else if (isWorld) {
        itemBuilds = await this.prisma.$queryRaw<Array<{
          items: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            items,
            SUM(games)::bigint AS games,
            SUM(wins)::bigint AS wins
          FROM champion_item_builds
          WHERE patch = ${patch}
            AND queue_id = 420
            AND rank_bracket = ${rankBracket}
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
            AND build_type = ${buildType}
          GROUP BY items
          ORDER BY SUM(games) DESC
          LIMIT 5
        `;
      } else {
        itemBuilds = await this.prisma.$queryRaw<Array<{
          items: number[];
          games: bigint;
          wins: bigint;
        }>>`
          SELECT
            items,
            games,
            wins
          FROM champion_item_builds
          WHERE patch = ${patch}
            AND region = ${region}
            AND queue_id = 420
            AND rank_bracket = ${rankBracket}
            AND role = ${normalizedRole}
            AND champion_id = ${championId}
            AND build_type = ${buildType}
          ORDER BY games DESC
          LIMIT 5
        `;
      }

      result[buildType] = itemBuilds.map((ib) => {
        const games = Number(ib.games);
        const wins = Number(ib.wins);
        const smoothedWinRate = (wins + this.SMOOTHING_K * 0.5) / (games + this.SMOOTHING_K);
        return {
          items: ib.items,
          winRate: smoothedWinRate,
          games,
        };
      });
    }

    return result;
  }

  /**
   * Get recommended item builds for a champion
   * Returns the most common core items (recommended) + top alternatives
   */
  async getRecommendedItems(
    championId: number,
    patch: string,
    rankBracket: string,
    role: string,
    region: string | null,
    limit: number = 5
  ): Promise<Array<{
    items: number[];
    winRate: number;
    games: number;
  }>> {
    const normalizedRole = role === 'ALL' || !role ? 'ALL' : role;
    const isAllRanks = rankBracket === 'all_ranks';
    const isWorld = !region;

    let itemBuilds;
    if (isAllRanks && isWorld) {
      itemBuilds = await this.prisma.$queryRaw<Array<{
        items: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          items,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_item_builds
        WHERE patch = ${patch}
          AND queue_id = 420
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND build_type IN ('core', 'full')
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY items
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
    } else if (isAllRanks) {
      itemBuilds = await this.prisma.$queryRaw<Array<{
        items: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          items,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_item_builds
        WHERE patch = ${patch}
          AND region = ${region}
          AND queue_id = 420
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND build_type IN ('core', 'full')
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY items
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
    } else if (isWorld) {
      itemBuilds = await this.prisma.$queryRaw<Array<{
        items: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          items,
          SUM(games)::bigint AS games,
          SUM(wins)::bigint AS wins
        FROM champion_item_builds
        WHERE patch = ${patch}
          AND queue_id = 420
          AND rank_bracket = ${rankBracket}
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND build_type IN ('core', 'full')
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        GROUP BY items
        ORDER BY SUM(games) DESC
        LIMIT ${limit}
      `;
    } else {
      itemBuilds = await this.prisma.$queryRaw<Array<{
        items: number[];
        games: bigint;
        wins: bigint;
      }>>`
        SELECT
          items,
          games,
          wins
        FROM champion_item_builds
        WHERE patch = ${patch}
          AND region = ${region}
          AND queue_id = 420
          AND rank_bracket = ${rankBracket}
          AND role = ${normalizedRole}
          AND champion_id = ${championId}
          AND build_type IN ('core', 'full')
          AND games >= ${this.MIN_GAMES_THRESHOLD}
        ORDER BY games DESC
        LIMIT ${limit}
      `;
    }

    if (!itemBuilds || itemBuilds.length === 0) {
      return [];
    }

    return itemBuilds.map((ib) => {
      const games = Number(ib.games);
      const wins = Number(ib.wins);
      const smoothedWinRate = (wins + this.SMOOTHING_K * 0.5) / (games + this.SMOOTHING_K);

      return {
        items: ib.items,
        winRate: smoothedWinRate,
        games,
      };
    });
  }

  /**
   * Get build archetypes for a champion
   * Groups rune pages with their commonly used item builds
   * Returns build archetypes like "Tank", "AP", "Lethality", "Crit", etc.
   */
  async getBuildArchetypes(
    championId: number,
    patch: string,
    rankBracket: string,
    role: string,
    region: string | null,
    limit: number = 5
  ): Promise<Array<{
    archetype: string; // "Recommended", "Tank", "AP", "Lethality", "Crit", etc.
    runes: {
      primaryStyleId: number;
      subStyleId: number;
      perkIds: number[];
      statShards: number[];
      winRate: number;
      games: number;
    };
    spells: {
      spell1Id: number;
      spell2Id: number;
      winRate: number;
      games: number;
    };
    items: {
      items: number[];
      winRate: number;
      games: number;
    };
    totalGames: number;
    overallWinRate: number;
  }>> {
    const normalizedRole = role === 'ALL' || !role ? 'ALL' : role;
    const isAllRanks = rankBracket === 'all_ranks';
    const isWorld = !region;

    // Get top rune pages and item builds
    const [runePages, itemBuilds, spellSets] = await Promise.all([
      this.getRecommendedRunes(championId, patch, rankBracket, role, region, limit * 2),
      this.getRecommendedItems(championId, patch, rankBracket, role, region, limit * 2),
      this.getRecommendedSpells(championId, patch, rankBracket, role, region, limit * 2),
    ]);

    this.logger.log(`[getBuildArchetypes] Found ${runePages.length} rune pages, ${itemBuilds.length} item builds, ${spellSets.length} spell sets for champion ${championId} (patch=${patch}, role=${normalizedRole}, rank=${rankBracket}, region=${region || 'world'})`);

    if (runePages.length === 0 || itemBuilds.length === 0) {
      this.logger.warn(`[getBuildArchetypes] No build data found for champion ${championId} - runes: ${runePages.length}, items: ${itemBuilds.length}`);
      
      // Check if data exists in the database at all
      const [totalRunePages, totalItemBuilds] = await Promise.all([
        this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint as count
          FROM champion_rune_pages
          WHERE champion_id = ${championId}
        `,
        this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint as count
          FROM champion_item_builds
          WHERE champion_id = ${championId}
        `,
      ]);
      
      this.logger.warn(`[getBuildArchetypes] Total rune pages in DB for champion ${championId}: ${Number(totalRunePages[0]?.count || 0)}, total item builds: ${Number(totalItemBuilds[0]?.count || 0)}`);
      
      // Check what patches are available
      const availablePatches = await this.prisma.$queryRaw<Array<{ patch: string }>>`
        SELECT DISTINCT patch
        FROM champion_rune_pages
        WHERE champion_id = ${championId}
        ORDER BY patch DESC
        LIMIT 5
      `;
      this.logger.warn(`[getBuildArchetypes] Available patches for champion ${championId}: ${availablePatches.map(p => p.patch).join(', ') || 'none'}`);
      
      return [];
    }

    // Find which rune pages are commonly used with which item builds
    // We'll query the database to find matches
    const archetypes: Array<{
      archetype: string;
      runes: typeof runePages[0];
      spells: typeof spellSets[0];
      items: typeof itemBuilds[0];
      totalGames: number;
      overallWinRate: number;
    }> = [];

    // For each rune page, find the most common item build used with it
    for (const runePage of runePages.slice(0, limit)) {
      // Find item builds that are commonly used with this rune page by querying matches
      let matchingItems: Array<{ items: number[]; games: bigint; wins: bigint }> = [];
      
      try {
        // Build dynamic WHERE clause based on filters
        let query: any;
        if (isAllRanks && isWorld) {
          query = Prisma.sql`
            SELECT
              pfi.items,
              COUNT(*)::bigint AS games,
              SUM(CASE WHEN mp.win = true THEN 1 ELSE 0 END)::bigint AS wins
            FROM participant_perks pp
            JOIN participant_final_items pfi ON pp.match_id = pfi.match_id AND pp.puuid = pfi.puuid
            JOIN match_participants mp ON mp.match_id = pp.match_id AND mp.puuid = pp.puuid
            JOIN matches m ON m.match_id = pp.match_id
            WHERE m.patch = ${patch}
              AND m.queue_id = 420
              AND pp.champion_id = ${championId}
              AND pp.role = ${normalizedRole}
              AND pp.primary_style_id = ${runePage.primaryStyleId}
              AND pp.sub_style_id = ${runePage.subStyleId}
              AND pp.perk_ids = ${runePage.perkIds}::int[]
            GROUP BY pfi.items
            HAVING COUNT(*) >= ${this.MIN_GAMES_THRESHOLD}
            ORDER BY COUNT(*) DESC
            LIMIT 1
          `;
        } else if (isAllRanks) {
          query = Prisma.sql`
            SELECT
              pfi.items,
              COUNT(*)::bigint AS games,
              SUM(CASE WHEN mp.win = true THEN 1 ELSE 0 END)::bigint AS wins
            FROM participant_perks pp
            JOIN participant_final_items pfi ON pp.match_id = pfi.match_id AND pp.puuid = pfi.puuid
            JOIN match_participants mp ON mp.match_id = pp.match_id AND mp.puuid = pp.puuid
            JOIN matches m ON m.match_id = pp.match_id
            WHERE m.patch = ${patch}
              AND m.region = ${region}
              AND m.queue_id = 420
              AND pp.champion_id = ${championId}
              AND pp.role = ${normalizedRole}
              AND pp.primary_style_id = ${runePage.primaryStyleId}
              AND pp.sub_style_id = ${runePage.subStyleId}
              AND pp.perk_ids = ${runePage.perkIds}::int[]
            GROUP BY pfi.items
            HAVING COUNT(*) >= ${this.MIN_GAMES_THRESHOLD}
            ORDER BY COUNT(*) DESC
            LIMIT 1
          `;
        } else if (isWorld) {
          query = Prisma.sql`
            SELECT
              pfi.items,
              COUNT(*)::bigint AS games,
              SUM(CASE WHEN mp.win = true THEN 1 ELSE 0 END)::bigint AS wins
            FROM participant_perks pp
            JOIN participant_final_items pfi ON pp.match_id = pfi.match_id AND pp.puuid = pfi.puuid
            JOIN match_participants mp ON mp.match_id = pp.match_id AND mp.puuid = pp.puuid
            JOIN matches m ON m.match_id = pp.match_id
            WHERE m.patch = ${patch}
              AND m.queue_id = 420
              AND m.rank_bracket = ${rankBracket}
              AND pp.champion_id = ${championId}
              AND pp.role = ${normalizedRole}
              AND pp.primary_style_id = ${runePage.primaryStyleId}
              AND pp.sub_style_id = ${runePage.subStyleId}
              AND pp.perk_ids = ${runePage.perkIds}::int[]
            GROUP BY pfi.items
            HAVING COUNT(*) >= ${this.MIN_GAMES_THRESHOLD}
            ORDER BY COUNT(*) DESC
            LIMIT 1
          `;
        } else {
          query = Prisma.sql`
            SELECT
              pfi.items,
              COUNT(*)::bigint AS games,
              SUM(CASE WHEN mp.win = true THEN 1 ELSE 0 END)::bigint AS wins
            FROM participant_perks pp
            JOIN participant_final_items pfi ON pp.match_id = pfi.match_id AND pp.puuid = pfi.puuid
            JOIN match_participants mp ON mp.match_id = pp.match_id AND mp.puuid = pp.puuid
            JOIN matches m ON m.match_id = pp.match_id
            WHERE m.patch = ${patch}
              AND m.region = ${region}
              AND m.queue_id = 420
              AND m.rank_bracket = ${rankBracket}
              AND pp.champion_id = ${championId}
              AND pp.role = ${normalizedRole}
              AND pp.primary_style_id = ${runePage.primaryStyleId}
              AND pp.sub_style_id = ${runePage.subStyleId}
              AND pp.perk_ids = ${runePage.perkIds}::int[]
            GROUP BY pfi.items
            HAVING COUNT(*) >= ${this.MIN_GAMES_THRESHOLD}
            ORDER BY COUNT(*) DESC
            LIMIT 1
          `;
        }
        
        matchingItems = await this.prisma.$queryRaw<Array<{
          items: number[];
          games: bigint;
          wins: bigint;
        }>>(query);
      } catch (error) {
        this.logger.warn(`Failed to find matching items for rune page:`, error);
      }

      // If no matching items found, use the most common item build
      if (matchingItems.length === 0 && itemBuilds.length > 0) {
        matchingItems = [{
          items: itemBuilds[0].items,
          games: BigInt(itemBuilds[0].games),
          wins: BigInt(Math.round(itemBuilds[0].games * itemBuilds[0].winRate)),
        }];
      }

      if (matchingItems.length > 0) {
        const itemBuildData = matchingItems[0];
        const itemBuild = itemBuilds.find(ib => 
          ib.items.length === itemBuildData.items.length &&
          ib.items.every((id, idx) => id === itemBuildData.items[idx])
        ) || {
          items: itemBuildData.items,
          winRate: Number(itemBuildData.wins) / Number(itemBuildData.games),
          games: Number(itemBuildData.games),
        };
        
        const matchingSpell = spellSets[0] || spellSets.find(s => s.games >= this.MIN_GAMES_THRESHOLD) || spellSets[0];
        
        // Determine archetype based on items
        const archetype = this.determineArchetype(itemBuild.items, runePage.primaryStyleId);
        
        // Calculate combined win rate (weighted average)
        const totalGames = Math.min(runePage.games, itemBuild.games);
        const overallWinRate = (runePage.winRate + itemBuild.winRate) / 2;

        archetypes.push({
          archetype: archetypes.length === 0 ? 'Recommended' : archetype,
          runes: runePage,
          spells: matchingSpell || spellSets[0],
          items: itemBuild,
          totalGames,
          overallWinRate,
        });
      }
    }

    // If we don't have enough archetypes, add standalone builds
    if (archetypes.length < limit && itemBuilds.length > archetypes.length) {
      for (let i = archetypes.length; i < Math.min(limit, itemBuilds.length); i++) {
        const itemBuild = itemBuilds[i];
        const matchingRune = runePages[i] || runePages[0];
        const matchingSpell = spellSets[i] || spellSets[0];
        const archetype = this.determineArchetype(itemBuild.items, matchingRune.primaryStyleId);
        
        archetypes.push({
          archetype: archetypes.length === 0 ? 'Recommended' : archetype,
          runes: matchingRune,
          spells: matchingSpell,
          items: itemBuild,
          totalGames: Math.min(matchingRune.games, itemBuild.games),
          overallWinRate: (matchingRune.winRate + itemBuild.winRate) / 2,
        });
      }
    }

    // Sort by total games (most popular first)
    return archetypes.sort((a, b) => b.totalGames - a.totalGames);
  }

  /**
   * Determine build archetype based on items and primary rune style
   * This is a heuristic - in production you'd want more sophisticated logic
   */
  private determineArchetype(items: number[], primaryStyleId: number): string {
    // Common item IDs for different archetypes (these would need to be updated based on current items)
    // This is a simplified heuristic
    const tankItemIds = [3068, 3075, 3083, 3084, 3109, 3110, 3111, 3193, 3194]; // Thornmail, Randuin's, etc.
    const apItemIds = [3089, 3157, 3165, 3285, 4636, 4637, 4638]; // Rabadon's, Void Staff, etc.
    const adItemIds = [3031, 3036, 3072, 3074, 3508]; // Infinity Edge, Bloodthirster, etc.
    const lethalityItemIds = [6691, 6692, 6693, 6694, 6695, 6696]; // Lethality items
    
    const hasTankItems = items.some(id => tankItemIds.includes(id));
    const hasAPItems = items.some(id => apItemIds.includes(id));
    const hasADItems = items.some(id => adItemIds.includes(id));
    const hasLethalityItems = items.some(id => lethalityItemIds.includes(id));

    // Determine based on items
    if (hasTankItems && !hasAPItems && !hasADItems) return 'Tank';
    if (hasAPItems && !hasTankItems) return 'AP';
    if (hasLethalityItems) return 'Lethality';
    if (hasADItems && items.some(id => [3031, 3036].includes(id))) return 'Crit'; // Infinity Edge, etc.
    if (hasADItems) return 'AD';
    
    // Fallback: determine by primary rune style
    if (primaryStyleId === 8000) return 'Precision'; // Precision tree
    if (primaryStyleId === 8100) return 'Domination'; // Domination tree
    if (primaryStyleId === 8300) return 'Inspiration'; // Inspiration tree
    if (primaryStyleId === 8400) return 'Resolve'; // Resolve tree (often tank)
    if (primaryStyleId === 8200) return 'Sorcery'; // Sorcery tree (often AP)
    
    return 'Alternative';
  }
}
