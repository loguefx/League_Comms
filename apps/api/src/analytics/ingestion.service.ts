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
   * Ingest a single match into the U.GG-style schema
   * @param region - The region code (e.g., 'na1')
   * @param matchId - The match ID
   * @param rankBracket - Rank bracket for this match (e.g., 'emerald_plus', 'diamond', 'master_plus')
   */
  async ingestMatch(region: string, matchId: string, rankBracket: string = 'unknown'): Promise<void> {
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

      // Filter invalid matches (remakes, wrong queue, etc.)
      if (this.shouldSkipMatch(match)) {
        this.logger.debug(`Skipping invalid match ${matchId}`);
        return;
      }

      // Extract patch version from gameVersion (e.g., "16.3.123.4567" -> "16.3")
      const patch = match.info.gameVersion.split('.').slice(0, 2).join('.');
      
      // Convert gameCreation timestamp to DateTime
      const gameStartTs = new Date(match.info.gameCreation);
      const durationS = match.info.gameDuration;

      // Store match
      await this.prisma.match.create({
        data: {
          matchId,
          region,
          queueId: match.info.queueId,
          gameStartTs,
          durationS,
          patch,
          gameVersion: match.info.gameVersion,
          rankBracket,
          participants: {
            create: match.info.participants.map((p: any) => ({
              puuid: p.puuid,
              teamId: p.teamId,
              championId: p.championId,
              role: this.normalizeRole(p.teamPosition || p.individualPosition || p.role),
              win: p.win,
            })),
          },
          bans: {
            create: this.extractBans(match),
          },
        },
      });

      this.logger.log(`Ingested match ${matchId} (${patch}, ${rankBracket})`);
    } catch (error) {
      this.logger.error(`Failed to ingest match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Extract bans from match teams
   */
  private extractBans(match: any): Array<{ teamId: number; pickTurn: number; championId: number }> {
    const bans: Array<{ teamId: number; pickTurn: number; championId: number }> = [];
    
    if (match.info.teams) {
      match.info.teams.forEach((team: any) => {
        if (team.bans) {
          team.bans.forEach((ban: any, index: number) => {
            if (ban.championId !== -1) {
              bans.push({
                teamId: team.teamId,
                pickTurn: ban.pickTurn || index + 1,
                championId: ban.championId,
              });
            }
          });
        }
      });
    }
    
    return bans;
  }

  /**
   * Normalize Riot's position/role to U.GG format
   * Maps to: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
   */
  private normalizeRole(position: string | null | undefined): string {
    if (!position) return 'UTILITY'; // Default fallback
    
    const normalized = position.toUpperCase();
    
    // Map Riot's teamPosition values
    if (normalized === 'TOP') return 'TOP';
    if (normalized === 'JUNGLE') return 'JUNGLE';
    if (normalized === 'MIDDLE' || normalized === 'MID') return 'MIDDLE';
    if (normalized === 'BOTTOM') return 'BOTTOM';
    if (normalized === 'UTILITY') return 'UTILITY';
    
    // Fallback mappings
    if (normalized.includes('TOP')) return 'TOP';
    if (normalized.includes('JUNGLE')) return 'JUNGLE';
    if (normalized.includes('MID')) return 'MIDDLE';
    if (normalized.includes('BOTTOM') || normalized.includes('ADC')) return 'BOTTOM';
    if (normalized.includes('UTILITY') || normalized.includes('SUPPORT')) return 'UTILITY';
    
    return 'UTILITY'; // Default
  }

  /**
   * Check if match should be skipped (remake, invalid queue, etc.)
   */
  private shouldSkipMatch(match: any): boolean {
    // Skip remakes
    if (match.info.gameEndedInEarlySurrender || match.info.gameEndedInSurrender) {
      return true;
    }

    // Skip very short games (likely remakes) - less than 5 minutes
    if (match.info.gameDuration < 300) {
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
