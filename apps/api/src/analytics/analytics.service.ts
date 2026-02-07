import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getChampionStats(options: {
    rank?: string;
    role?: string;
    patch?: string;
  }) {
    const where: any = {};

    if (options.rank) {
      where.rankTier = options.rank;
    }

    if (options.role) {
      where.role = options.role;
    }

    if (options.patch) {
      where.patch = options.patch === 'latest' ? await this.getLatestPatch() : options.patch;
    } else {
      where.patch = await this.getLatestPatch();
    }

    // Debug: Check total records in table
    const totalRecords = await this.prisma.championRankAgg.count();
    console.log(`[AnalyticsService] Total championRankAgg records: ${totalRecords}`);
    console.log(`[AnalyticsService] Query where clause:`, JSON.stringify(where, null, 2));

    const stats = await this.prisma.championRankAgg.findMany({
      where,
      // No limit - get all champions
    });

    console.log(`[AnalyticsService] Found ${stats.length} records matching query`);

    // Calculate win rates and pick rates
    const totalMatches = stats.reduce((sum, s) => sum + s.matches, 0);

    const championsWithStats = stats.map((stat) => ({
      championId: stat.championId,
      rankTier: stat.rankTier,
      role: stat.role,
      patch: stat.patch,
      matches: stat.matches,
      wins: stat.wins,
      winRate: stat.matches > 0 ? (stat.wins / stat.matches) * 100 : 0,
      pickRate: totalMatches > 0 ? (stat.matches / totalMatches) * 100 : 0,
    }));

    // Sort by win rate (highest to lowest), then by matches for tie-breaking
    return championsWithStats.sort((a, b) => {
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return b.matches - a.matches;
    });
  }

  async getTotalMatchesPerRank(patch?: string) {
    const patchVersion = patch === 'latest' || !patch ? await this.getLatestPatch() : patch;

    const stats = await this.prisma.championRankAgg.groupBy({
      by: ['rankTier'],
      where: {
        patch: patchVersion,
      },
      _sum: {
        matches: true,
      },
    });

    return stats.map((stat) => ({
      rankTier: stat.rankTier,
      totalMatches: stat._sum.matches || 0,
    }));
  }

  private async getLatestPatch(): Promise<string> {
    const latest = await this.prisma.match.findFirst({
      orderBy: { patch: 'desc' },
      select: { patch: true },
    });

    return latest?.patch || '14.1';
  }

  async getDiagnostics() {
    const matchCount = await this.prisma.match.count();
    const participantCount = await this.prisma.matchParticipant.count();
    const championAggCount = await this.prisma.championRankAgg.count();
    
    return {
      database: {
        matches: matchCount,
        participants: participantCount,
        championAggregations: championAggCount,
      },
      message: matchCount === 0 
        ? 'Database is empty - no matches have been ingested yet. Sign in and play games, or seed with public match data.'
        : `Database has ${matchCount} matches. ${championAggCount > 0 ? 'Champion stats available.' : 'Run aggregation to populate champion stats.'}`,
    };
  }
}
