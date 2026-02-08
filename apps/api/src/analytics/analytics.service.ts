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
    const stats = await this.prisma.$queryRaw<Array<{
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
   * Normalize rank bracket (e.g., "PLATINUM_PLUS" -> "platinum_plus", "IRON_PLUS" -> "iron")
   * Handles both exact tiers (iron, bronze, etc.) and plus variants (iron_plus, platinum_plus, etc.)
   */
  private normalizeRankBracket(rank: string): string {
    if (!rank || rank === 'ALL_RANKS') {
      return 'all_ranks'; // Special case for all ranks
    }
    
    const normalized = rank.toLowerCase();
    
    // Handle exact tier matches (IRON_PLUS -> iron, since we store exact tiers as "iron")
    // For now, treat "IRON_PLUS" as "iron" since we're storing exact tiers
    if (normalized === 'iron_plus' || normalized === 'iron') {
      return 'iron';
    }
    if (normalized === 'bronze_plus' || normalized === 'bronze') {
      return 'bronze';
    }
    if (normalized === 'silver_plus' || normalized === 'silver') {
      return 'silver';
    }
    if (normalized === 'gold_plus' || normalized === 'gold') {
      return 'gold';
    }
    if (normalized === 'platinum_plus' || normalized === 'platinum') {
      return 'platinum';
    }
    if (normalized === 'emerald_plus' || normalized === 'emerald') {
      return 'emerald';
    }
    if (normalized === 'diamond_plus' || normalized === 'diamond') {
      return 'diamond';
    }
    
    // Master+ tiers stay as "master_plus"
    if (normalized.includes('master') || normalized.includes('challenger') || normalized.includes('grandmaster')) {
      return 'master_plus';
    }
    
    // Default: convert _PLUS to _plus for other cases
    return normalized.replace(/_plus$/, '_plus');
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
