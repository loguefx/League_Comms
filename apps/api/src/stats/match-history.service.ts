import { Injectable, Logger } from '@nestjs/common';
import { MatchClient } from '@league-voice/riot';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RiotAuthService } from '../auth/riot/riot-auth.service';
import { MATCH_HISTORY_CACHE_TTL_MS } from '@league-voice/shared';

@Injectable()
export class MatchHistoryService {
  private readonly logger = new Logger(MatchHistoryService.name);

  constructor(
    private matchClient: MatchClient,
    private prisma: PrismaService,
    private redis: RedisService,
    private riotAuthService: RiotAuthService
  ) {}

  async getMatchHistory(userId: string, count: number = 20): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { riotAccount: true },
    });

    if (!user || !user.riotAccount) {
      throw new Error('User not linked to Riot account');
    }

    const cacheKey = `match_history_ids:${user.riotAccount.puuid}:${count}`;

    // Check cache
    const cached = await this.redis.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get access token
    const accessToken = await this.riotAuthService.getAccessToken(userId);
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Fetch match IDs
    const matchIds = await this.matchClient.getMatchList(
      user.riotAccount.region as any,
      user.riotAccount.puuid,
      { count }
    );

    // Cache match IDs
    await this.redis.set(cacheKey, matchIds, MATCH_HISTORY_CACHE_TTL_MS / 1000);

    return matchIds;
  }

  async getMatchDetails(userId: string, matchId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { riotAccount: true },
    });

    if (!user || !user.riotAccount) {
      throw new Error('User not linked to Riot account');
    }

    const cacheKey = `match_details:${matchId}`;

    // Check cache
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get access token
    const accessToken = await this.riotAuthService.getAccessToken(userId);
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Fetch match details
    const match = await this.matchClient.getMatch(user.riotAccount.region as any, matchId);

    // Transform to our format
    const transformedMatch = {
      matchId: match.metadata.matchId,
      gameCreation: match.info.gameCreation,
      gameDuration: match.info.gameDuration,
      gameMode: match.info.gameMode,
      gameType: match.info.gameType,
      participants: match.info.participants.map((p: any) => ({
        summonerName: p.summonerName,
        championId: p.championId,
        championName: p.championName,
        teamId: p.teamId,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        damageDealtToChampions: p.totalDamageDealtToChampions,
        totalDamageDealt: p.totalDamageDealt,
        wardsPlaced: p.wardsPlaced,
        wardsKilled: p.wardsKilled,
        controlWardsPlaced: p.sightWardsBoughtInGame || 0,
        totalMinionsKilled: p.totalMinionsKilled,
        goldEarned: p.goldEarned,
        level: p.champLevel,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
        summoner1Id: p.summoner1Id,
        summoner2Id: p.summoner2Id,
        perks: p.perks,
        win: p.win,
        individualPosition: p.individualPosition,
        rank: null, // Would need to fetch from league API
      })),
      teams: match.info.teams.map((t: any) => ({
        teamId: t.teamId,
        win: t.win,
        objectives: {
          dragon: { kills: t.objectives.dragon.kills },
          baron: { kills: t.objectives.baron.kills },
          riftHerald: { kills: t.objectives.riftHerald.kills },
          tower: { kills: t.objectives.tower.kills },
          inhibitor: { kills: t.objectives.inhibitor.kills },
        },
      })),
    };

    // Cache for 1 hour
    await this.redis.set(cacheKey, transformedMatch, 3600);

    return transformedMatch;
  }
}
