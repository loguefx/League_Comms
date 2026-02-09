import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service to aggregate build data (runes, spells, items) into recommendations
 * Similar to how U.GG computes "Recommended Runes" and "Core Items"
 */
@Injectable()
export class BuildAggregationService {
  private readonly logger = new Logger(BuildAggregationService.name);
  private readonly MIN_GAMES_THRESHOLD = 200; // Minimum games for a build to be recommended
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
        : await this.prisma.match.findMany({
            select: { patch: true },
            distinct: ['patch'],
            where: { patch: { not: null } },
          }).then((matches) => [...new Set(matches.map((m) => m.patch))]);

      for (const p of patches) {
        this.logger.log(`Aggregating builds for patch ${p}...`);
        await this.aggregateRunePages(p);
        await this.aggregateSpellSets(p);
        await this.aggregateItemBuilds(p);
      }

      this.logger.log('Build aggregation complete');
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

    // Group by: patch, region, queueId, rankBracket, role, championId, rune page signature
    await this.prisma.$executeRaw`
      INSERT INTO champion_rune_pages (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id, perk_ids, stat_shards,
        games, wins, updated_at
      )
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
        SUM(CASE WHEN pp.win THEN 1 ELSE 0 END)::bigint AS wins,
        NOW() AS updated_at
      FROM participant_perks pp
      JOIN matches m ON m.match_id = pp.match_id
      WHERE m.patch = ${patch}
        AND m.queue_id = 420
      GROUP BY
        m.patch, m.region, m.queue_id, m.rank_bracket,
        pp.role, pp.champion_id,
        pp.primary_style_id, pp.sub_style_id, pp.perk_ids, pp.stat_shards
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id
      )
      DO UPDATE SET
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    // Also aggregate "ALL" role (aggregate across all roles)
    await this.prisma.$executeRaw`
      INSERT INTO champion_rune_pages (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id, perk_ids, stat_shards,
        games, wins, updated_at
      )
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
        SUM(CASE WHEN pp.win THEN 1 ELSE 0 END)::bigint AS wins,
        NOW() AS updated_at
      FROM participant_perks pp
      JOIN matches m ON m.match_id = pp.match_id
      WHERE m.patch = ${patch}
        AND m.queue_id = 420
      GROUP BY
        m.patch, m.region, m.queue_id, m.rank_bracket,
        pp.champion_id,
        pp.primary_style_id, pp.sub_style_id, pp.perk_ids, pp.stat_shards
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id,
        primary_style_id, sub_style_id
      )
      DO UPDATE SET
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    this.logger.log(`Rune pages aggregated for patch ${patch}`);
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
   * MVP: Compute "core items" from final items (top 3 most common completed items)
   */
  private async aggregateItemBuilds(patch: string): Promise<void> {
    this.logger.log(`Aggregating item builds for patch ${patch}...`);

    // For MVP, we'll compute "core items" as the top 3 most frequent items from winning games
    // This is a simplified version - U.GG uses timeline data for more accurate ordering
    
    // Core items: top 3 items by frequency in winning games
    await this.prisma.$executeRaw`
      WITH item_frequency AS (
        SELECT
          m.patch,
          m.region,
          m.queue_id,
          m.rank_bracket,
          pfi.role,
          pfi.champion_id,
          UNNEST(pfi.items) AS item_id,
          COUNT(*)::bigint AS frequency
        FROM participant_final_items pfi
        JOIN matches m ON m.match_id = pfi.match_id
        WHERE m.patch = ${patch}
          AND m.queue_id = 420
          AND pfi.win = true
          AND array_length(pfi.items, 1) >= 3
        GROUP BY
          m.patch, m.region, m.queue_id, m.rank_bracket,
          pfi.role, pfi.champion_id, item_id
      ),
      top_items AS (
        SELECT
          patch, region, queue_id, rank_bracket, role, champion_id,
          array_agg(item_id ORDER BY frequency DESC) FILTER (WHERE row_number <= 3) AS core_items
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (PARTITION BY patch, region, queue_id, rank_bracket, role, champion_id ORDER BY frequency DESC) AS row_number
          FROM item_frequency
        ) ranked
        WHERE row_number <= 3
        GROUP BY patch, region, queue_id, rank_bracket, role, champion_id
      )
      INSERT INTO champion_item_builds (
        patch, region, queue_id, rank_bracket, role, champion_id,
        build_type, items, games, wins, updated_at
      )
      SELECT
        ti.patch,
        ti.region,
        ti.queue_id,
        ti.rank_bracket,
        ti.role,
        ti.champion_id,
        'core' AS build_type,
        ti.core_items,
        COUNT(DISTINCT pfi.match_id)::bigint AS games,
        SUM(CASE WHEN pfi.win THEN 1 ELSE 0 END)::bigint AS wins,
        NOW() AS updated_at
      FROM top_items ti
      JOIN participant_final_items pfi ON
        pfi.champion_id = ti.champion_id
        AND pfi.items && ti.core_items  -- Items overlap
      JOIN matches m ON m.match_id = pfi.match_id
        AND m.patch = ti.patch
        AND m.region = ti.region
        AND m.queue_id = ti.queue_id
        AND m.rank_bracket = ti.rank_bracket
      WHERE array_length(ti.core_items, 1) = 3
      GROUP BY
        ti.patch, ti.region, ti.queue_id, ti.rank_bracket,
        ti.role, ti.champion_id, ti.core_items
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id, build_type
      )
      DO UPDATE SET
        items = EXCLUDED.items,
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    // Also aggregate "ALL" role
    await this.prisma.$executeRaw`
      WITH item_frequency AS (
        SELECT
          m.patch,
          m.region,
          m.queue_id,
          m.rank_bracket,
          pfi.champion_id,
          UNNEST(pfi.items) AS item_id,
          COUNT(*)::bigint AS frequency
        FROM participant_final_items pfi
        JOIN matches m ON m.match_id = pfi.match_id
        WHERE m.patch = ${patch}
          AND m.queue_id = 420
          AND pfi.win = true
          AND array_length(pfi.items, 1) >= 3
        GROUP BY
          m.patch, m.region, m.queue_id, m.rank_bracket,
          pfi.champion_id, item_id
      ),
      top_items AS (
        SELECT
          patch, region, queue_id, rank_bracket, champion_id,
          array_agg(item_id ORDER BY frequency DESC) FILTER (WHERE row_number <= 3) AS core_items
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (PARTITION BY patch, region, queue_id, rank_bracket, champion_id ORDER BY frequency DESC) AS row_number
          FROM item_frequency
        ) ranked
        WHERE row_number <= 3
        GROUP BY patch, region, queue_id, rank_bracket, champion_id
      )
      INSERT INTO champion_item_builds (
        patch, region, queue_id, rank_bracket, role, champion_id,
        build_type, items, games, wins, updated_at
      )
      SELECT
        ti.patch,
        ti.region,
        ti.queue_id,
        ti.rank_bracket,
        'ALL' AS role,
        ti.champion_id,
        'core' AS build_type,
        ti.core_items,
        COUNT(DISTINCT pfi.match_id)::bigint AS games,
        SUM(CASE WHEN pfi.win THEN 1 ELSE 0 END)::bigint AS wins,
        NOW() AS updated_at
      FROM top_items ti
      JOIN participant_final_items pfi ON
        pfi.champion_id = ti.champion_id
        AND pfi.items && ti.core_items
      JOIN matches m ON m.match_id = pfi.match_id
        AND m.patch = ti.patch
        AND m.region = ti.region
        AND m.queue_id = ti.queue_id
        AND m.rank_bracket = ti.rank_bracket
      WHERE array_length(ti.core_items, 1) = 3
      GROUP BY
        ti.patch, ti.region, ti.queue_id, ti.rank_bracket,
        ti.champion_id, ti.core_items
      ON CONFLICT (
        patch, region, queue_id, rank_bracket, role, champion_id, build_type
      )
      DO UPDATE SET
        items = EXCLUDED.items,
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = NOW()
    `;

    this.logger.log(`Item builds aggregated for patch ${patch}`);
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
    }

    if (!runePages || runePages.length === 0) {
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
          AND build_type = 'core'
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
          AND build_type = 'core'
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
          AND build_type = 'core'
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
          AND build_type = 'core'
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
}
