import { Injectable, Logger, Optional } from '@nestjs/common';
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
    @Optional() @InjectQueue('match-ingestion') private ingestionQueue?: Queue
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

      // Extract patch version from gameVersion (e.g., "16.3.123.4567" -> "16.3")
      const patch = match.info.gameVersion.split('.').slice(0, 2).join('.');

      // Filter invalid matches (remakes, wrong queue, etc.)
      if (this.shouldSkipMatch(match)) {
        this.logger.debug(`Skipping invalid match ${matchId}`);
        return;
      }

      // Extract bans from match teams
      const bans: number[] = [];
      if (match.info.teams) {
        match.info.teams.forEach((team: any) => {
          if (team.bans) {
            team.bans.forEach((ban: any) => {
              if (ban.championId !== -1) {
                bans.push(ban.championId);
              }
            });
          }
        });
      }

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
              // Use teamPosition (most reliable) with fallback to individualPosition
              // teamPosition: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
              role: this.normalizeRole(p.teamPosition || p.individualPosition || p.role),
              rankTier: p.rankTier || defaultRankTier || null,
              rankDivision: p.rankDivision || null,
              teamId: p.teamId.toString(),
              won: p.win,
            })),
          },
        },
      });

      // Store bans separately (if you add a bans table later)
      // For now, we'll track bans in aggregation

      this.logger.log(`Ingested match ${matchId}`);
    } catch (error) {
      this.logger.error(`Failed to ingest match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Normalize Riot's position/role to our standard format
   * Uses teamPosition (most reliable) with proper mapping
   */
  private normalizeRole(position: string | null | undefined): string | null {
    if (!position) return null;
    
    const normalized = position.toUpperCase();
    
    // Map Riot's teamPosition values to our roles
    if (normalized === 'TOP') return 'TOP';
    if (normalized === 'JUNGLE') return 'JUNGLE';
    if (normalized === 'MIDDLE' || normalized === 'MID') return 'MID';
    if (normalized === 'BOTTOM') return 'ADC';
    if (normalized === 'UTILITY') return 'SUPPORT';
    
    // Fallback for older/alternative formats
    if (normalized.includes('TOP')) return 'TOP';
    if (normalized.includes('JUNGLE')) return 'JUNGLE';
    if (normalized.includes('MID')) return 'MID';
    if (normalized.includes('BOTTOM') || normalized.includes('ADC')) return 'ADC';
    if (normalized.includes('UTILITY') || normalized.includes('SUPPORT')) return 'SUPPORT';
    
    return null;
  }

  /**
   * Check if match should be skipped (remake, invalid queue, etc.)
   */
  private shouldSkipMatch(match: any): boolean {
    // Skip remakes
    if (match.info.gameEndedInEarlySurrender || match.info.gameEndedInSurrender) {
      return true;
    }

    // Skip very short games (likely remakes)
    if (match.info.gameDuration < 300) { // Less than 5 minutes
      return true;
    }

    // Only process ranked solo/flex queues (420 = Ranked Solo, 440 = Ranked Flex)
    const validQueues = [420, 440];
    if (!validQueues.includes(match.info.queueId)) {
      return true;
    }

    return false;
  }
}
