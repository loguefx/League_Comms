import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MatchClient } from '@league-voice/riot';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private matchClient: MatchClient,
    private prisma: PrismaService,
    private redis: RedisService,
    private rateLimiter: RateLimiterService,
    @Optional() @InjectQueue('match-ingestion') private ingestionQueue?: Queue
  ) {}

  /**
   * Ingest a single match into the U.GG-style schema
   * @param region - The region code (e.g., 'na1')
   * @param matchId - The match ID
   * @param rankBracket - Rank bracket for this match (e.g., 'emerald_plus', 'diamond', 'master_plus')
   */
  async ingestMatch(region: string, matchId: string, rankBracket: string = 'unknown'): Promise<void> {
    // #region agent log
    const ingestStartTime = Date.now();
    // #endregion
    
    // Check if already ingested
    const existing = await this.prisma.match.findUnique({
      where: { matchId },
    });

    if (existing) {
      // #region agent log
      console.log(`[ingestMatch] Match ${matchId} already exists, skipping`);
      // #endregion
      return; // Already ingested
    }

    try {
      // Rate limit: wait before API call
      await this.rateLimiter.waitForRequest();
      
      // Fetch match from Riot API with retry logic for 429 errors
      let match;
      let retryAttempt = 0;
      while (true) {
        try {
          match = await this.matchClient.getMatch(region as any, matchId);
          break; // Success, exit retry loop
        } catch (error: any) {
          // Check if it's a 429 rate limit error
          if (error?.response?.status === 429 || error?.status === 429) {
            retryAttempt++;
            if (retryAttempt > 3) {
              this.logger.error(`Rate limit exceeded after 3 retries for match ${matchId}`);
              throw error;
            }
            await this.rateLimiter.handleRateLimitError(retryAttempt);
            continue; // Retry
          }
          // Not a 429 error, throw it
          throw error;
        }
      }

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

      // Extract participant data
      const participants = match.info.participants.map((p: any) => ({
        puuid: p.puuid,
        teamId: p.teamId,
        championId: p.championId,
        role: this.normalizeRole(p.teamPosition || p.individualPosition || p.role),
        win: p.win,
      }));

      // Extract build data
      const perks = this.extractPerks(match.info.participants);
      const spells = this.extractSpells(match.info.participants);
      const finalItems = this.extractFinalItems(match.info.participants);

      // Log extraction results for verification
      this.logger.log(`[ingestMatch] Extracted data for match ${matchId}: ${perks.length} perks, ${spells.length} spells, ${finalItems.length} final items`);
      if (finalItems.length > 0) {
        const sampleItems = finalItems[0]?.items || [];
        this.logger.log(`[ingestMatch] Sample items array length: ${sampleItems.length}, items: ${sampleItems.slice(0, 7).join(', ')}`);
      }

      // Store match with participants and bans
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
            create: participants,
          },
          bans: {
            create: this.extractBans(match),
          },
          // Store build data (runes, spells, items)
          perks: {
            create: perks,
          },
          spells: {
            create: spells,
          },
          finalItems: {
            create: finalItems,
          },
        },
      });

      this.logger.log(`Ingested match ${matchId} (${patch}, ${rankBracket}) with build data`);
      
      // #region agent log
      const ingestEndTime = Date.now();
      const ingestDuration = ingestEndTime - ingestStartTime;
      const totalMatches = await this.prisma.match.count();
      const totalParticipants = await this.prisma.matchParticipant.count();
      const totalPerks = await this.prisma.participantPerk.count();
      const totalItems = await this.prisma.participantFinalItem.count();
      console.log(`[ingestMatch] Successfully ingested match ${matchId}: ${patch}, ${rankBracket}, took ${ingestDuration}ms`);
      console.log(`[ingestMatch] Database totals: ${totalMatches} matches, ${totalParticipants} participants, ${totalPerks} perks, ${totalItems} items`);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ingestion.service.ts:128',message:'Match ingested successfully',data:{matchId,patch,rankBracket,ingestDurationMs:ingestDuration,totalMatches,totalParticipants,totalPerks,totalItems},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      this.logger.error(`Failed to ingest match ${matchId}:`, error);
      // #region agent log
      console.error(`[ingestMatch] Failed to ingest match ${matchId}:`, error);
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ingestion.service.ts:135',message:'Match ingestion failed',data:{matchId,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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
   * Extract runes/perks from participants
   */
  private extractPerks(participants: any[]): Array<{
    puuid: string;
    championId: number;
    role: string;
    win: boolean;
    primaryStyleId: number;
    subStyleId: number;
    perkIds: number[];
    statShards: number[];
  }> {
    return participants
      .filter((p: any) => p.perks) // Only if perks exist
      .map((p: any) => {
        const perks = p.perks;
        // Riot API uses 'primaryStyle' or 'Primary' for description
        const primaryStyle = perks.styles?.find((s: any) => 
          s.description === 'primaryStyle' || s.description === 'Primary' || s.style !== undefined
        ) || perks.styles?.[0]; // Fallback to first style if description doesn't match
        const subStyle = perks.styles?.find((s: any) => 
          s.description === 'subStyle' || s.description === 'Sub' || (s.style !== undefined && s !== primaryStyle)
        ) || perks.styles?.[1]; // Fallback to second style
        
        // Extract perk IDs: [keystone, primary1, primary2, primary3, sub1, sub2]
        const perkIds: number[] = [];
        if (primaryStyle?.selections) {
          primaryStyle.selections.forEach((sel: any) => {
            if (sel.perk !== undefined) perkIds.push(sel.perk);
          });
        }
        if (subStyle?.selections) {
          subStyle.selections.forEach((sel: any) => {
            if (sel.perk !== undefined) perkIds.push(sel.perk);
          });
        }
        
        // Extract stat shards (statPerks)
        const statShards: number[] = [];
        if (perks.statPerks) {
          if (perks.statPerks.defense !== undefined) statShards.push(perks.statPerks.defense);
          if (perks.statPerks.flex !== undefined) statShards.push(perks.statPerks.flex);
          if (perks.statPerks.offense !== undefined) statShards.push(perks.statPerks.offense);
        }
        
        return {
          puuid: p.puuid,
          championId: p.championId,
          role: this.normalizeRole(p.teamPosition || p.individualPosition || p.role),
          win: p.win,
          primaryStyleId: primaryStyle?.style || 0,
          subStyleId: subStyle?.style || 0,
          perkIds,
          statShards,
        };
      })
      .filter((p) => p.primaryStyleId > 0 && p.perkIds.length > 0); // Only valid perks
  }

  /**
   * Extract summoner spells from participants
   */
  private extractSpells(participants: any[]): Array<{
    puuid: string;
    championId: number;
    role: string;
    win: boolean;
    spell1Id: number;
    spell2Id: number;
  }> {
    return participants
      .filter((p: any) => p.summoner1Id !== undefined && p.summoner2Id !== undefined)
      .map((p: any) => ({
        puuid: p.puuid,
        championId: p.championId,
        role: this.normalizeRole(p.teamPosition || p.individualPosition || p.role),
        win: p.win,
        spell1Id: p.summoner1Id,
        spell2Id: p.summoner2Id,
      }));
  }

  /**
   * Extract final items from participants
   */
  private extractFinalItems(participants: any[]): Array<{
    puuid: string;
    championId: number;
    role: string;
    win: boolean;
    items: number[];
  }> {
    return participants.map((p: any) => {
      // Extract items from item0-item6, filter out 0 (empty slot)
      // IMPORTANT: Keep ALL items including 0s for position-based aggregation
      // We'll filter 0s when displaying, but need them for position tracking
      const items: number[] = [];
      for (let i = 0; i <= 6; i++) {
        const itemId = p[`item${i}`];
        // Store item ID even if 0, so we can track position (items[1] = first item, items[6] = sixth item)
        items.push(itemId || 0);
      }
      
      // Log extraction for debugging (first participant only)
      if (participants.indexOf(p) === 0) {
        this.logger.debug(`[extractFinalItems] Sample participant items: item0=${p.item0}, item1=${p.item1}, item2=${p.item2}, item3=${p.item3}, item4=${p.item4}, item5=${p.item5}, item6=${p.item6}`);
        this.logger.debug(`[extractFinalItems] Extracted items array: [${items.join(', ')}]`);
      }
      
      return {
        puuid: p.puuid,
        championId: p.championId,
        role: this.normalizeRole(p.teamPosition || p.individualPosition || p.role),
        win: p.win,
        items,
      };
    });
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
