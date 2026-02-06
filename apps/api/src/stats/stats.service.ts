import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MatchHistoryService } from './match-history.service';
import type { PlayerStats, ChampionPlay, Role } from '@league-voice/shared';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private matchHistoryService: MatchHistoryService
  ) {}

  async getPlayerStats(userId: string): Promise<PlayerStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { riotAccount: true },
    });

    if (!user || !user.riotAccount) {
      throw new Error('User not linked to Riot account');
    }

    return this.getPlayerStatsByPuuid(user.riotAccount.puuid, user.riotAccount.region);
  }

  async getPlayerStatsByPuuid(puuid: string, region: string): Promise<PlayerStats> {
    const cacheKey = `player_stats:${puuid}`;
    const cached = await this.redis.get<PlayerStats>(cacheKey);
    if (cached) {
      return cached;
    }

    // Find user by PUUID to get match history
    const user = await this.prisma.user.findFirst({
      where: {
        riotAccount: { puuid },
      },
    });

    if (!user) {
      // If user doesn't exist in our DB, we can't get their stats
      // Return empty stats or fetch from Riot API directly
      throw new Error('Player not found in database');
    }

    // Get match history
    const matches = await this.matchHistoryService.getMatchHistory(user.id, 100);

    // Calculate stats
    const stats = this.calculateStats(matches, puuid);

    // Cache for 5 minutes
    await this.redis.set(cacheKey, stats, 300);

    return stats;
  }

  private calculateStats(matches: any[], puuid: string): PlayerStats {
    let wins = 0;
    let losses = 0;
    let last20Wins = 0;
    let last20Losses = 0;

    const roleCounts: Record<string, number> = {};
    const championStats: Record<number, { games: number; wins: number; losses: number }> = {};

    matches.forEach((match, index) => {
      const participant = match.info.participants.find((p: any) => p.puuid === puuid);
      if (!participant) return;

      const won = participant.win;
      if (won) {
        wins++;
        if (index < 20) last20Wins++;
      } else {
        losses++;
        if (index < 20) last20Losses++;
      }

      // Count role
      const role = this.normalizeRole(participant.individualPosition || participant.role);
      if (role) {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      }

      // Count champion
      const champId = participant.championId;
      if (!championStats[champId]) {
        championStats[champId] = { games: 0, wins: 0, losses: 0 };
      }
      championStats[champId].games++;
      if (won) {
        championStats[champId].wins++;
      } else {
        championStats[champId].losses++;
      }
    });

    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    const last20WinRate = last20Wins + last20Losses > 0 ? (last20Wins / (last20Wins + last20Losses)) * 100 : 0;

    // Find main role (most played)
    const mainRole = Object.entries(roleCounts).reduce(
      (a, b) => (roleCounts[a[0]] > roleCounts[b[0]] ? a : b),
      ['', 0]
    )[0] as Role | null;

    // Top champions
    const topChampions: ChampionPlay[] = Object.entries(championStats)
      .map(([championId, stats]) => ({
        championId: parseInt(championId),
        games: stats.games,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    return {
      puuid,
      wins,
      losses,
      totalGames,
      winRate,
      last20Wins,
      last20Losses,
      last20WinRate,
      mainRole: mainRole || null,
      topChampions,
    };
  }

  private normalizeRole(position: string): Role | null {
    const normalized = position.toUpperCase();
    if (normalized.includes('TOP')) return 'TOP';
    if (normalized.includes('JUNGLE')) return 'JUNGLE';
    if (normalized.includes('MID') || normalized.includes('MIDDLE')) return 'MID';
    if (normalized.includes('BOTTOM') || normalized.includes('ADC')) return 'ADC';
    if (normalized.includes('UTILITY') || normalized.includes('SUPPORT')) return 'SUPPORT';
    return null;
  }
}
