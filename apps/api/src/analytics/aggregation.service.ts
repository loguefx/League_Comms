import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RANK_TIER_GROUPS } from '@league-voice/shared';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async aggregateChampionStats() {
    this.logger.log('Starting champion stats aggregation');

    // Get all unique patches
    const patches = await this.prisma.match.findMany({
      select: { patch: true },
      distinct: ['patch'],
      orderBy: { patch: 'desc' },
      take: 5, // Last 5 patches
    });

    for (const { patch } of patches) {
      await this.aggregateForPatch(patch);
    }

    this.logger.log('Champion stats aggregation complete');
  }

  private async aggregateForPatch(patch: string) {
    // Aggregate by individual rank tiers
    const rankTiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

    for (const rankTier of rankTiers) {
      await this.aggregateForRankTier(patch, rankTier);
    }

    // Aggregate for grouped tiers (EMERALD_PLUS, etc.)
    for (const [groupName, tiers] of Object.entries(RANK_TIER_GROUPS)) {
      await this.aggregateForRankGroup(patch, groupName, [...tiers]);
    }

    // Aggregate "ALL_RANKS" (across all rank tiers)
    await this.aggregateForAllRanks(patch);
  }

  /**
   * Aggregate champion stats across ALL ranks (for "All Ranks" filter)
   */
  private async aggregateForAllRanks(patch: string) {
    const allRankTiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

    // Aggregate by role (TOP, JUNGLE, MID, ADC, SUPPORT) across all ranks
    const stats = await this.prisma.matchParticipant.groupBy({
      by: ['championId', 'role'],
      where: {
        match: { patch },
        rankTier: { in: allRankTiers },
        role: { not: null },
      },
      _count: true,
    });

    for (const stat of stats) {
      if (!stat.role) continue;

      const wins = await this.prisma.matchParticipant.count({
        where: {
          championId: stat.championId,
          role: stat.role,
          rankTier: { in: allRankTiers },
          match: { patch },
          won: true,
        },
      });

      await this.prisma.championRankAgg.upsert({
        where: {
          rankTier_championId_role_patch: {
            rankTier: 'ALL_RANKS',
            championId: stat.championId,
            role: stat.role,
            patch,
          },
        },
        update: {
          matches: stat._count,
          wins,
        },
        create: {
          rankTier: 'ALL_RANKS',
          championId: stat.championId,
          role: stat.role,
          patch,
          matches: stat._count,
          wins,
        },
      });
    }

    // Also aggregate "ALL roles" across "ALL ranks"
    const allRoleStats = await this.prisma.matchParticipant.groupBy({
      by: ['championId'],
      where: {
        match: { patch },
        rankTier: { in: allRankTiers },
        role: { not: null },
      },
      _count: true,
    });

    for (const stat of allRoleStats) {
      const wins = await this.prisma.matchParticipant.count({
        where: {
          championId: stat.championId,
          rankTier: { in: allRankTiers },
          match: { patch },
          role: { not: null },
          won: true,
        },
      });

      await this.prisma.championRankAgg.upsert({
        where: {
          rankTier_championId_role_patch: {
            rankTier: 'ALL_RANKS',
            championId: stat.championId,
            role: null, // null = ALL roles
            patch,
          },
        },
        update: {
          matches: stat._count,
          wins,
        },
        create: {
          rankTier: 'ALL_RANKS',
          championId: stat.championId,
          role: null, // null = ALL roles
          patch,
          matches: stat._count,
          wins,
        },
      });
    }
  }

  private async aggregateForRankTier(patch: string, rankTier: string) {
    // Aggregate by role (TOP, JUNGLE, MID, ADC, SUPPORT)
    const stats = await this.prisma.matchParticipant.groupBy({
      by: ['championId', 'role'],
      where: {
        match: { patch },
        rankTier,
        role: { not: null }, // Only aggregate roles that are set
      },
      _count: true,
    });

    for (const stat of stats) {
      if (!stat.role) continue; // Skip if role is null

      const wins = await this.prisma.matchParticipant.count({
        where: {
          championId: stat.championId,
          role: stat.role,
          rankTier,
          match: { patch },
          won: true,
        },
      });

      await this.prisma.championRankAgg.upsert({
        where: {
          rankTier_championId_role_patch: {
            rankTier,
            championId: stat.championId,
            role: stat.role,
            patch,
          },
        },
        update: {
          matches: stat._count,
          wins,
        },
        create: {
          rankTier,
          championId: stat.championId,
          role: stat.role,
          patch,
          matches: stat._count,
          wins,
        },
      });
    }

    // Also aggregate "ALL" roles (champion across all roles)
    const allRoleStats = await this.prisma.matchParticipant.groupBy({
      by: ['championId'],
      where: {
        match: { patch },
        rankTier,
        role: { not: null },
      },
      _count: true,
    });

    for (const stat of allRoleStats) {
      const wins = await this.prisma.matchParticipant.count({
        where: {
          championId: stat.championId,
          rankTier,
          match: { patch },
          role: { not: null },
          won: true,
        },
      });

      // Store with role = null to represent "ALL roles"
      await this.prisma.championRankAgg.upsert({
        where: {
          rankTier_championId_role_patch: {
            rankTier,
            championId: stat.championId,
            role: null, // null = ALL roles
            patch,
          },
        },
        update: {
          matches: stat._count,
          wins,
        },
        create: {
          rankTier,
          championId: stat.championId,
          role: null, // null = ALL roles
          patch,
          matches: stat._count,
          wins,
        },
      });
    }
  }

  private async aggregateForRankGroup(patch: string, groupName: string, tiers: string[]) {
    // Aggregate by role (TOP, JUNGLE, MID, ADC, SUPPORT)
    const stats = await this.prisma.matchParticipant.groupBy({
      by: ['championId', 'role'],
      where: {
        match: { patch },
        rankTier: { in: tiers },
        role: { not: null },
      },
      _count: true,
    });

    for (const stat of stats) {
      if (!stat.role) continue;

      const wins = await this.prisma.matchParticipant.count({
        where: {
          championId: stat.championId,
          role: stat.role,
          rankTier: { in: tiers },
          match: { patch },
          won: true,
        },
      });

      await this.prisma.championRankAgg.upsert({
        where: {
          rankTier_championId_role_patch: {
            rankTier: groupName,
            championId: stat.championId,
            role: stat.role,
            patch,
          },
        },
        update: {
          matches: stat._count,
          wins,
        },
        create: {
          rankTier: groupName,
          championId: stat.championId,
          role: stat.role,
          patch,
          matches: stat._count,
          wins,
        },
      });
    }

    // Also aggregate "ALL" roles (champion across all roles)
    const allRoleStats = await this.prisma.matchParticipant.groupBy({
      by: ['championId'],
      where: {
        match: { patch },
        rankTier: { in: tiers },
        role: { not: null },
      },
      _count: true,
    });

    for (const stat of allRoleStats) {
      const wins = await this.prisma.matchParticipant.count({
        where: {
          championId: stat.championId,
          rankTier: { in: tiers },
          match: { patch },
          role: { not: null },
          won: true,
        },
      });

      // Store with role = null to represent "ALL roles"
      await this.prisma.championRankAgg.upsert({
        where: {
          rankTier_championId_role_patch: {
            rankTier: groupName,
            championId: stat.championId,
            role: null, // null = ALL roles
            patch,
          },
        },
        update: {
          matches: stat._count,
          wins,
        },
        create: {
          rankTier: groupName,
          championId: stat.championId,
          role: null, // null = ALL roles
          patch,
          matches: stat._count,
          wins,
        },
      });
    }
  }
}
