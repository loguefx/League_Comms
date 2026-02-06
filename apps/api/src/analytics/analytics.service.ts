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

    const stats = await this.prisma.championRankAgg.findMany({
      where,
      orderBy: [
        { wins: 'desc' },
        { matches: 'desc' },
      ],
      take: 100,
    });

    // Calculate win rates and pick rates
    const totalMatches = stats.reduce((sum, s) => sum + s.matches, 0);

    return stats.map((stat) => ({
      championId: stat.championId,
      rankTier: stat.rankTier,
      role: stat.role,
      patch: stat.patch,
      matches: stat.matches,
      wins: stat.wins,
      winRate: stat.matches > 0 ? (stat.wins / stat.matches) * 100 : 0,
      pickRate: totalMatches > 0 ? (stat.matches / totalMatches) * 100 : 0,
    }));
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
}
