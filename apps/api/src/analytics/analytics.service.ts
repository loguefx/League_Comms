import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
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
    
    const region = options.region || 'na1';
    const queueId = 420; // Ranked Solo
    const rankBracket = this.normalizeRankBracket(options.rank || 'ALL_RANKS');
    const role = this.normalizeRole(options.role || 'ALL');

    // Query champion stats with bucket totals for pick/ban rates
    // Handle "all_ranks" by aggregating across all rank brackets
    const isAllRanks = rankBracket === 'all_ranks';
    
    let stats;
    if (isAllRanks) {
      // Aggregate across all rank brackets
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
    } else {
      // Specific rank bracket
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

    // Convert BigInt to numbers and format percentages
    const championsWithStats = stats.map((stat) => ({
      championId: Number(stat.champion_id),
      games: Number(stat.games),
      wins: Number(stat.wins),
      winRate: Number(stat.win_rate) * 100, // Convert to percentage
      pickRate: Number(stat.pick_rate) * 100, // Convert to percentage
      banRate: Number(stat.ban_rate) * 100, // Convert to percentage
    }));

    return championsWithStats;
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
   * Normalize role (e.g., "MID" -> "MIDDLE", "ALL" -> "ALL")
   */
  private normalizeRole(role: string): string {
    const normalized = role.toUpperCase();
    
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
