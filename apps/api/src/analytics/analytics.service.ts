import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get champion stats for tier list (U.GG-style query)
   * @param options - Filter options
   */
  async getChampionStats(options: {
    rank?: string;
    role?: string;
    patch?: string;
    region?: string;
  }) {
    // Normalize inputs
    const patch = options.patch === 'latest' || !options.patch 
      ? await this.getLatestPatch() 
      : options.patch;
    
    // Handle region: 'world' means aggregate across all regions, otherwise filter by specific region
    const isWorld = options.region === 'world' || !options.region;
    const region = options.region && options.region !== 'world' ? options.region : null;
    const queueId = 420; // Ranked Solo
    const rankBracket = this.normalizeRankBracket(options.rank || 'ALL_RANKS');
    // Frontend sends empty string '' for "All Roles", normalizeRole handles this
    const role = this.normalizeRole(options.role || 'ALL');
    
    this.logger.log(`[getChampionStats] Query params: rank=${options.rank}, role=${options.role}, patch=${options.patch}, region=${options.region}`);
    this.logger.log(`[getChampionStats] Normalized: rankBracket=${rankBracket}, role=${role}, patch=${patch}, isWorld=${isWorld}, isAllRanks=${rankBracket === 'all_ranks'}`);

    // Query champion stats with bucket totals for pick/ban rates
    // Handle "all_ranks" by aggregating across all rank brackets
    // Handle "world" region by aggregating across all regions
    const isAllRanks = rankBracket === 'all_ranks';
    
    let stats;
    if (isAllRanks && isWorld) {
      // Aggregate across all rank brackets AND all regions
      stats = await this.prisma.$queryRaw<Array<{
        champion_id: number;
        games: bigint;
        wins: bigint;
        win_rate: number;
        pick_rate: number;
        ban_rate: number;
      }>>`
        SELECT
          cs.champion_id,
          SUM(cs.games)::bigint AS games,
          SUM(cs.wins)::bigint AS wins,
          (SUM(cs.wins)::numeric / NULLIF(SUM(cs.games), 0)) AS win_rate,
          (SUM(cs.games)::numeric / NULLIF(SUM(bt.total_games), 0)) AS pick_rate,
          (SUM(cs.banned_matches)::numeric / NULLIF(SUM(bt.total_matches), 0)) AS ban_rate
        FROM champion_stats cs
        JOIN bucket_totals bt
          ON bt.patch = cs.patch
         AND bt.region = cs.region
         AND bt.queue_id = cs.queue_id
         AND bt.rank_bracket = cs.rank_bracket
         AND bt.role = cs.role
        WHERE cs.patch = ${patch}
          AND cs.queue_id = ${queueId}
          AND cs.role = ${role}
        GROUP BY cs.champion_id
        ORDER BY win_rate DESC
      `;
    } else if (isAllRanks) {
      // Aggregate across all rank brackets for specific region
      stats = await this.prisma.$queryRaw<Array<{
        champion_id: number;
        games: bigint;
        wins: bigint;
        win_rate: number;
        pick_rate: number;
        ban_rate: number;
      }>>`
        SELECT
          cs.champion_id,
          SUM(cs.games)::bigint AS games,
          SUM(cs.wins)::bigint AS wins,
          (SUM(cs.wins)::numeric / NULLIF(SUM(cs.games), 0)) AS win_rate,
          (SUM(cs.games)::numeric / NULLIF(SUM(bt.total_games), 0)) AS pick_rate,
          (SUM(cs.banned_matches)::numeric / NULLIF(SUM(bt.total_matches), 0)) AS ban_rate
        FROM champion_stats cs
        JOIN bucket_totals bt
          ON bt.patch = cs.patch
         AND bt.region = cs.region
         AND bt.queue_id = cs.queue_id
         AND bt.rank_bracket = cs.rank_bracket
         AND bt.role = cs.role
        WHERE cs.patch = ${patch}
          AND cs.region = ${region}
          AND cs.queue_id = ${queueId}
          AND cs.role = ${role}
        GROUP BY cs.champion_id
        ORDER BY win_rate DESC
      `;
    } else if (isWorld) {
      // Specific rank bracket, aggregate across all regions
      stats = await this.prisma.$queryRaw<Array<{
        champion_id: number;
        games: bigint;
        wins: bigint;
        win_rate: number;
        pick_rate: number;
        ban_rate: number;
      }>>`
        SELECT
          cs.champion_id,
          SUM(cs.games)::bigint AS games,
          SUM(cs.wins)::bigint AS wins,
          (SUM(cs.wins)::numeric / NULLIF(SUM(cs.games), 0)) AS win_rate,
          (SUM(cs.games)::numeric / NULLIF(SUM(bt.total_games), 0)) AS pick_rate,
          (SUM(cs.banned_matches)::numeric / NULLIF(SUM(bt.total_matches), 0)) AS ban_rate
        FROM champion_stats cs
        JOIN bucket_totals bt
          ON bt.patch = cs.patch
         AND bt.region = cs.region
         AND bt.queue_id = cs.queue_id
         AND bt.rank_bracket = cs.rank_bracket
         AND bt.role = cs.role
        WHERE cs.patch = ${patch}
          AND cs.queue_id = ${queueId}
          AND cs.rank_bracket = ${rankBracket}
          AND cs.role = ${role}
        GROUP BY cs.champion_id
        ORDER BY win_rate DESC
      `;
    } else {
      // Specific rank bracket and region
      stats = await this.prisma.$queryRaw<Array<{
        champion_id: number;
        games: bigint;
        wins: bigint;
        win_rate: number;
        pick_rate: number;
        ban_rate: number;
      }>>`
        SELECT
          cs.champion_id,
          cs.games,
          cs.wins,
          (cs.wins::numeric / NULLIF(cs.games, 0)) AS win_rate,
          (cs.games::numeric / NULLIF(bt.total_games, 0)) AS pick_rate,
          (cs.banned_matches::numeric / NULLIF(bt.total_matches, 0)) AS ban_rate
        FROM champion_stats cs
        JOIN bucket_totals bt
          ON bt.patch = cs.patch
         AND bt.region = cs.region
         AND bt.queue_id = cs.queue_id
         AND bt.rank_bracket = cs.rank_bracket
         AND bt.role = cs.role
        WHERE cs.patch = ${patch}
          AND cs.region = ${region}
          AND cs.queue_id = ${queueId}
          AND cs.rank_bracket = ${rankBracket}
          AND cs.role = ${role}
        ORDER BY win_rate DESC
      `;
    }

    this.logger.log(`[getChampionStats] Found ${stats.length} raw champion stats from database`);
    
    if (stats.length === 0) {
      this.logger.warn(`[getChampionStats] No champion stats found for patch=${patch}, rankBracket=${rankBracket}, role=${role}, region=${region || 'world'}`);
      this.logger.warn(`[getChampionStats] This might mean: 1) No matches ingested yet, 2) Aggregation hasn't run, or 3) No data for these filters`);
      
      // Check if we have any champion stats at all
      const anyStats = await this.prisma.championStat.findFirst();
      if (!anyStats) {
        this.logger.warn(`[getChampionStats] No champion stats exist in database at all - aggregation may not have run`);
      } else {
        this.logger.warn(`[getChampionStats] Champion stats exist but don't match filters - check patch/rank/role/region`);
      }
    }
    
    // Convert BigInt to numbers and format percentages
    const championsWithStats = stats.map((stat) => ({
      championId: Number(stat.champion_id),
      games: Number(stat.games),
      wins: Number(stat.wins),
      winRate: Number(stat.win_rate) * 100, // Convert to percentage
      pickRate: Number(stat.pick_rate) * 100, // Convert to percentage
      banRate: Number(stat.ban_rate) * 100, // Convert to percentage
    }));

    this.logger.log(`[getChampionStats] Processed ${championsWithStats.length} champions with stats`);

    // Calculate counter picks for each champion (skip if no champions to avoid unnecessary queries)
    const championsWithCounterPicks = championsWithStats.length > 0
      ? await Promise.all(
          championsWithStats.map(async (champ) => {
            const counterPicks = await this.getCounterPicks(champ.championId, patch, role, rankBracket, region);
            return {
              ...champ,
              counterPicks,
            };
          })
        )
      : [];

    this.logger.log(`[getChampionStats] Returning ${championsWithCounterPicks.length} champions with counter picks`);
    return championsWithCounterPicks;
  }

  /**
   * Normalize rank bracket to match database values
   * Database stores: "iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master_plus"
   * Frontend sends: "IRON_PLUS", "BRONZE_PLUS", etc. or "ALL_RANKS"
   * 
   * This function maps frontend values to database values:
   * - "IRON_PLUS" or "IRON" -> "iron"
   * - "BRONZE_PLUS" or "BRONZE" -> "bronze"
   * - "SILVER_PLUS" or "SILVER" -> "silver"
   * - "GOLD_PLUS" or "GOLD" -> "gold"
   * - "PLATINUM_PLUS" or "PLATINUM" -> "platinum"
   * - "EMERALD_PLUS" or "EMERALD" -> "emerald"
   * - "DIAMOND_PLUS" or "DIAMOND" -> "diamond"
   * - "MASTER_PLUS", "GRANDMASTER_PLUS", "CHALLENGER" -> "master_plus"
   * - "ALL_RANKS" -> "all_ranks" (special case for querying all)
   */
  private normalizeRankBracket(rank: string): string {
    if (!rank || rank === 'ALL_RANKS') {
      return 'all_ranks'; // Special case for all ranks
    }
    
    const normalized = rank.toLowerCase().trim();
    
    // Remove _plus suffix if present (iron_plus -> iron)
    const baseRank = normalized.replace(/_plus$/, '');
    
    // Map to database values (exact tiers stored as lowercase without _plus)
    const rankMap: Record<string, string> = {
      'iron': 'iron',
      'bronze': 'bronze',
      'silver': 'silver',
      'gold': 'gold',
      'platinum': 'platinum',
      'emerald': 'emerald',
      'diamond': 'diamond',
      // Master+ variants all map to master_plus
      'master': 'master_plus',
      'grandmaster': 'master_plus',
      'challenger': 'master_plus',
    };
    
    // Check if base rank exists in map
    if (rankMap[baseRank]) {
      return rankMap[baseRank];
    }
    
    // Fallback: if it already matches a database value, return as-is
    if (Object.values(rankMap).includes(normalized)) {
      return normalized;
    }
    
    // Default fallback: return normalized (shouldn't happen with valid inputs)
    this.logger.warn(`Unknown rank bracket: ${rank}, using normalized value: ${normalized}`);
    return normalized;
  }

  /**
   * Normalize role (e.g., "MID" -> "MIDDLE", "ALL" -> "ALL", "" -> "ALL")
   */
  private normalizeRole(role: string): string {
    // Handle empty string or undefined - map to 'ALL' for "All Roles"
    if (!role || role.trim() === '') {
      return 'ALL';
    }
    
    const normalized = role.toUpperCase().trim();
    
    // Map common variations
    if (normalized === 'MID' || normalized === 'MIDDLE') return 'MIDDLE';
    if (normalized === 'ADC' || normalized === 'BOT') return 'BOTTOM';
    if (normalized === 'SUP' || normalized === 'SUPPORT') return 'UTILITY';
    if (normalized === 'JG' || normalized === 'JUNGLE') return 'JUNGLE';
    if (normalized === 'TOP') return 'TOP';
    if (normalized === 'ALL' || normalized === 'ALL_ROLES') return 'ALL';
    
    return normalized;
  }

  /**
   * Get latest patch from matches
   */
  private async getLatestPatch(): Promise<string> {
    const latest = await this.prisma.match.findFirst({
      orderBy: { patch: 'desc' },
      select: { patch: true },
    });

    return latest?.patch || '16.1';
  }

  /**
   * Get available patches from database
   */
  async getAvailablePatches() {
    try {
      // Use groupBy to get distinct patches (Prisma's distinct doesn't work the way we need)
      const patchGroups = await this.prisma.match.groupBy({
        by: ['patch'],
        _count: {
          patch: true,
        },
        orderBy: {
          patch: 'desc',
        },
      });

      const patchList = patchGroups
        .map((p) => p.patch)
        .filter((patch): patch is string => Boolean(patch) && typeof patch === 'string');
      
      const latest = patchList[0] || null;

      this.logger.log(`[getAvailablePatches] Found ${patchList.length} patches: ${patchList.join(', ')}`);

      return {
        patches: patchList,
        latest,
      };
    } catch (error) {
      this.logger.error(`[getAvailablePatches] Error querying patches:`, error);
      // Fallback: try a simpler query
      try {
        const allMatches = await this.prisma.match.findMany({
          select: { patch: true },
          take: 1000, // Limit to avoid huge queries
        });
        const uniquePatches = [...new Set(allMatches.map((m) => m.patch).filter(Boolean))].sort().reverse();
        this.logger.log(`[getAvailablePatches] Fallback query found ${uniquePatches.length} patches`);
        return {
          patches: uniquePatches,
          latest: uniquePatches[0] || null,
        };
      } catch (fallbackError) {
        this.logger.error(`[getAvailablePatches] Fallback query also failed:`, fallbackError);
        return {
          patches: [],
          latest: null,
        };
      }
    }
  }

  /**
   * Get counter picks for a champion
   * Counter picks are champions that have high win rate AGAINST this champion
   */
  private async getCounterPicks(
    championId: number,
    patch: string,
    role: string,
    rankBracket: string,
    region: string | null
  ): Promise<number[]> {
    try {
      // Query matches where this champion lost
      // Find which enemy champions won most often against this champion
      const isAllRanks = rankBracket === 'all_ranks';
      const isWorld = !region;

      let counterPicks;
      if (isAllRanks && isWorld) {
        counterPicks = await this.prisma.$queryRaw<Array<{ champion_id: number; win_rate: number }>>`
          SELECT 
            enemy.champion_id,
            (SUM(CASE WHEN enemy.win = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) AS win_rate
          FROM match_participants main
          JOIN matches m ON m.match_id = main.match_id
          JOIN match_participants enemy 
            ON enemy.match_id = main.match_id 
            AND enemy.team_id != main.team_id
            AND enemy.role = main.role
          WHERE main.champion_id = ${championId}
            AND main.win = false
            AND m.patch = ${patch}
            AND main.role = ${role}
          GROUP BY enemy.champion_id
          HAVING COUNT(*) >= 10
          ORDER BY win_rate DESC
          LIMIT 6
        `;
      } else if (isAllRanks) {
        counterPicks = await this.prisma.$queryRaw<Array<{ champion_id: number; win_rate: number }>>`
          SELECT 
            enemy.champion_id,
            (SUM(CASE WHEN enemy.win = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) AS win_rate
          FROM match_participants main
          JOIN matches m ON m.match_id = main.match_id
          JOIN match_participants enemy 
            ON enemy.match_id = main.match_id 
            AND enemy.team_id != main.team_id
            AND enemy.role = main.role
          WHERE main.champion_id = ${championId}
            AND main.win = false
            AND m.patch = ${patch}
            AND m.region = ${region}
            AND main.role = ${role}
          GROUP BY enemy.champion_id
          HAVING COUNT(*) >= 10
          ORDER BY win_rate DESC
          LIMIT 6
        `;
      } else if (isWorld) {
        counterPicks = await this.prisma.$queryRaw<Array<{ champion_id: number; win_rate: number }>>`
          SELECT 
            enemy.champion_id,
            (SUM(CASE WHEN enemy.win = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) AS win_rate
          FROM match_participants main
          JOIN matches m ON m.match_id = main.match_id
          JOIN match_participants enemy 
            ON enemy.match_id = main.match_id 
            AND enemy.team_id != main.team_id
            AND enemy.role = main.role
          WHERE main.champion_id = ${championId}
            AND main.win = false
            AND m.patch = ${patch}
            AND m.rank_bracket = ${rankBracket}
            AND main.role = ${role}
          GROUP BY enemy.champion_id
          HAVING COUNT(*) >= 10
          ORDER BY win_rate DESC
          LIMIT 6
        `;
      } else {
        counterPicks = await this.prisma.$queryRaw<Array<{ champion_id: number; win_rate: number }>>`
          SELECT 
            enemy.champion_id,
            (SUM(CASE WHEN enemy.win = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) AS win_rate
          FROM match_participants main
          JOIN matches m ON m.match_id = main.match_id
          JOIN match_participants enemy 
            ON enemy.match_id = main.match_id 
            AND enemy.team_id != main.team_id
            AND enemy.role = main.role
          WHERE main.champion_id = ${championId}
            AND main.win = false
            AND m.patch = ${patch}
            AND m.rank_bracket = ${rankBracket}
            AND m.region = ${region}
            AND main.role = ${role}
          GROUP BY enemy.champion_id
          HAVING COUNT(*) >= 10
          ORDER BY win_rate DESC
          LIMIT 6
        `;
      }

      return counterPicks.map((cp) => Number(cp.champion_id));
    } catch (error) {
      this.logger.warn(`Failed to get counter picks for champion ${championId}:`, error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get diagnostics about database state
   */
  async getDiagnostics() {
    const matchCount = await this.prisma.match.count();
    const participantCount = await this.prisma.matchParticipant.count();
    const championStatCount = await this.prisma.championStat.count();
    const bucketTotalCount = await this.prisma.bucketTotal.count();
    
    return {
      database: {
        matches: matchCount,
        participants: participantCount,
        championStats: championStatCount,
        bucketTotals: bucketTotalCount,
      },
      message: matchCount === 0 
        ? 'Database is empty - no matches have been ingested yet. Run batch seeding to populate data.'
        : `Database has ${matchCount} matches. ${championStatCount > 0 ? 'Champion stats available.' : 'Run aggregation to populate champion stats.'}`,
    };
  }
}
