import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MatchClient } from '@league-voice/riot';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private matchClient: MatchClient,
    private prisma: PrismaService,
    private redis: RedisService,
    @InjectQueue('match-ingestion') private ingestionQueue: Queue
  ) {}

  /**
   * Start continuous match ingestion
   */
  async startIngestion() {
    // This would be called on app startup or via admin endpoint
    // For now, we'll add jobs to process matches
    this.logger.log('Starting match ingestion pipeline');
  }

  /**
   * Ingest a single match
   * @param region - The region code (e.g., 'na1')
   * @param matchId - The match ID
   * @param defaultRankTier - Optional default rank tier if not available in match data (e.g., 'CHALLENGER' for high-elo seeds)
   */
  async ingestMatch(region: string, matchId: string, defaultRankTier?: string): Promise<void> {
    // Check if already ingested
    const existing = await this.prisma.match.findUnique({
      where: { matchId },
    });

    if (existing) {
      return; // Already ingested
    }

    try {
      // Fetch match from Riot API
      const match = await this.matchClient.getMatch(region as any, matchId);

      // Extract patch version from gameVersion
      const patch = match.info.gameVersion.split('.').slice(0, 2).join('.');

      // Store match
      await this.prisma.match.create({
        data: {
          matchId,
          region,
          patch,
          gameMode: match.info.gameMode,
          participants: {
            create: match.info.participants.map((p: any) => ({
              puuid: p.puuid,
              championId: p.championId,
              role: this.normalizeRole(p.individualPosition || p.role),
              rankTier: p.rankTier || defaultRankTier || null,
              rankDivision: p.rankDivision || null,
              teamId: p.teamId.toString(),
              won: p.win,
            })),
          },
        },
      });

      this.logger.log(`Ingested match ${matchId}`);
    } catch (error) {
      this.logger.error(`Failed to ingest match ${matchId}:`, error);
      throw error;
    }
  }

  private normalizeRole(position: string): string | null {
    const normalized = position.toUpperCase();
    if (normalized.includes('TOP')) return 'TOP';
    if (normalized.includes('JUNGLE')) return 'JUNGLE';
    if (normalized.includes('MID') || normalized.includes('MIDDLE')) return 'MID';
    if (normalized.includes('BOTTOM') || normalized.includes('ADC')) return 'ADC';
    if (normalized.includes('UTILITY') || normalized.includes('SUPPORT')) return 'SUPPORT';
    return null;
  }
}
