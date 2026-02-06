import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SpectatorClient, SummonerClient } from '@league-voice/riot';
import { RiotAuthService } from '../auth/riot/riot-auth.service';
import { GameGateway } from './game.gateway';
import { ACTIVE_GAME_POLL_INTERVAL_MS } from '@league-voice/shared';

@Injectable()
export class GameDetectionService {
  private readonly logger = new Logger(GameDetectionService.name);
  private activePollingUsers = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private spectatorClient: SpectatorClient,
    private summonerClient: SummonerClient,
    private riotAuthService: RiotAuthService,
    private gameGateway: GameGateway,
    @InjectQueue('game-detection') private gameQueue: Queue
  ) {}

  /**
   * Start polling for active game for a user
   */
  async startPolling(userId: string): Promise<void> {
    if (this.activePollingUsers.has(userId)) {
      return; // Already polling
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        riotAccount: true,
        settings: true,
      },
    });

    if (!user || !user.riotAccount || !user.settings?.autoJoinVoice) {
      return;
    }

    this.activePollingUsers.add(userId);

    // Add recurring job to queue
    await this.gameQueue.add(
      'poll-active-game',
      { userId },
      {
        repeat: {
          every: ACTIVE_GAME_POLL_INTERVAL_MS,
        },
        jobId: `poll-${userId}`,
      }
    );

    this.logger.log(`Started polling for user ${userId}`);
  }

  /**
   * Stop polling for active game for a user
   */
  async stopPolling(userId: string): Promise<void> {
    this.activePollingUsers.delete(userId);
    await this.gameQueue.removeRepeatableByKey(`poll-${userId}:::${ACTIVE_GAME_POLL_INTERVAL_MS}`);
    this.logger.log(`Stopped polling for user ${userId}`);
  }

  /**
   * Poll for active game (called by queue processor)
   */
  async pollActiveGame(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        riotAccount: true,
        settings: true,
      },
    });

    if (!user || !user.riotAccount || !user.settings?.autoJoinVoice) {
      await this.stopPolling(userId);
      return;
    }

    try {
      const accessToken = await this.riotAuthService.getAccessToken(userId);
      if (!accessToken) {
        this.logger.warn(`No access token for user ${userId}`);
        return;
      }

      // Get summoner ID from PUUID
      const summoner = await this.summonerClient.getSummonerByPuuid(
        user.riotAccount.region as any,
        user.riotAccount.puuid
      );

      // Check for active game
      const activeGame = await this.spectatorClient.getActiveGameBySummonerId(
        user.riotAccount.region as any,
        summoner.id
      );

      if (activeGame) {
        // Game detected!
        const userTeamId = this.spectatorClient.getUserTeamId(activeGame, summoner.id);
        if (userTeamId) {
          const roomKey = `${user.riotAccount.region}:${activeGame.gameId}:${userTeamId}`;
          const teammates = this.spectatorClient.getTeamParticipants(activeGame, userTeamId);
          
          // Get both teams
          const blueTeam = this.spectatorClient.getTeamParticipants(activeGame, 100);
          const redTeam = this.spectatorClient.getTeamParticipants(activeGame, 200);

          // Determine game phase
          // If gameStartTime is in the future or very recent, likely in ban/loading phase
          const now = Date.now();
          const gameStartTime = activeGame.gameStartTime;
          const timeUntilStart = gameStartTime - now;
          let phase: 'ban' | 'loading' | 'in-game' = 'in-game';
          
          if (timeUntilStart > 0) {
            // Game hasn't started yet - ban phase
            phase = 'ban';
          } else if (timeUntilStart > -30000) {
            // Within 30 seconds of start - loading phase
            phase = 'loading';
          }

          // Extract banned champions if available (from activeGame.bannedChampions)
          const bannedChampions = (activeGame as any).bannedChampions || [];

          // Emit game started event with full game data
          this.gameGateway.emitGameStarted(userId, {
            gameId: activeGame.gameId.toString(),
            teamId: userTeamId.toString(),
            region: user.riotAccount.region,
            roomKey,
            phase,
            gameStartTime: activeGame.gameStartTime,
            blueTeam: blueTeam.map((t, idx) => ({
              summonerName: t.summonerName,
              championId: t.championId,
              spell1Id: t.spell1Id,
              spell2Id: t.spell2Id,
              profileIconId: t.profileIconId,
              summonerId: t.summonerId,
              participantId: idx,
            })),
            redTeam: redTeam.map((t, idx) => ({
              summonerName: t.summonerName,
              championId: t.championId,
              spell1Id: t.spell1Id,
              spell2Id: t.spell2Id,
              profileIconId: t.profileIconId,
              summonerId: t.summonerId,
              participantId: idx + 5, // Red team starts at index 5
            })),
            teammates: teammates.map((t) => ({
              summonerName: t.summonerName,
              championId: t.championId,
              spell1Id: t.spell1Id,
              spell2Id: t.spell2Id,
            })),
            bannedChampions: bannedChampions.map((ban: any) => ({
              championId: ban.championId,
              teamId: ban.teamId,
            })),
          });

          this.logger.log(`Game detected for user ${userId}: ${roomKey} (phase: ${phase})`);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No active game - this is normal
        return;
      }
      this.logger.error(`Error polling active game for user ${userId}:`, error);
    }
  }
}
