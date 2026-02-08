import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AggregationService implements OnModuleInit {
  private readonly logger = new Logger(AggregationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run aggregation on module initialization (server startup)
   * This ensures champion stats are available immediately if matches exist
   */
  async onModuleInit() {
    // Wait a bit for database to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.logger.log('Running initial aggregation on startup...');
    try {
      await this.aggregateChampionStats();
      this.logger.log('Initial aggregation complete');
    } catch (error) {
      this.logger.warn('Initial aggregation failed (this is OK if no matches exist yet):', error);
      // Don't throw - allow server to start even if aggregation fails
    }
  }

  /**
   * Run full aggregation (bucket totals + champion stats + ban stats)
   * This is called:
   * - On server startup (via onModuleInit)
   * - Every 10 minutes (via @Cron)
   * - Manually via POST /champions/aggregate
   */
  async aggregateChampionStats() {
    this.logger.log('Starting champion stats aggregation');
    
    try {
      await this.computeBucketTotals();
      await this.computeChampionStats();
      await this.computeBanStats();
      this.logger.log('Champion stats aggregation complete');
    } catch (error) {
      this.logger.error('Aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Scheduled aggregation - runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledAggregation() {
    await this.aggregateChampionStats();
  }

  /**
   * Step A: Compute bucket totals (denominators for pick/ban rates)
   * This computes totals for both role-specific and ALL roles
   */
  private async computeBucketTotals() {
    this.logger.log('Computing bucket totals...');

    // Role-specific totals
    await this.prisma.$executeRaw`
      INSERT INTO bucket_totals (patch, region, queue_id, rank_bracket, role, total_games, total_matches, updated_at)
      SELECT
        m.patch,
        m.region,
        m.queue_id,
        m.rank_bracket,
        p.role,
        COUNT(*)::bigint AS total_games,
        COUNT(DISTINCT m.match_id)::bigint AS total_matches,
        now()
      FROM matches m
      JOIN match_participants p ON p.match_id = m.match_id
      WHERE m.queue_id = 420
      GROUP BY m.patch, m.region, m.queue_id, m.rank_bracket, p.role
      ON CONFLICT (patch, region, queue_id, rank_bracket, role)
      DO UPDATE SET
        total_games = EXCLUDED.total_games,
        total_matches = EXCLUDED.total_matches,
        updated_at = now()
    `;

    // ALL roles totals
    await this.prisma.$executeRaw`
      INSERT INTO bucket_totals (patch, region, queue_id, rank_bracket, role, total_games, total_matches, updated_at)
      SELECT
        m.patch,
        m.region,
        m.queue_id,
        m.rank_bracket,
        'ALL' AS role,
        COUNT(*)::bigint AS total_games,
        COUNT(DISTINCT m.match_id)::bigint AS total_matches,
        now()
      FROM matches m
      JOIN match_participants p ON p.match_id = m.match_id
      WHERE m.queue_id = 420
      GROUP BY m.patch, m.region, m.queue_id, m.rank_bracket
      ON CONFLICT (patch, region, queue_id, rank_bracket, role)
      DO UPDATE SET
        total_games = EXCLUDED.total_games,
        total_matches = EXCLUDED.total_matches,
        updated_at = now()
    `;

    this.logger.log('Bucket totals computed');
  }

  /**
   * Step B: Compute champion stats (games, wins) per bucket
   * This computes stats for both role-specific and ALL roles
   */
  private async computeChampionStats() {
    this.logger.log('Computing champion stats...');

    // Role-specific stats
    await this.prisma.$executeRaw`
      INSERT INTO champion_stats (patch, region, queue_id, rank_bracket, role, champion_id, games, wins, updated_at)
      SELECT
        m.patch,
        m.region,
        m.queue_id,
        m.rank_bracket,
        p.role,
        p.champion_id,
        COUNT(*)::bigint AS games,
        SUM(CASE WHEN p.win THEN 1 ELSE 0 END)::bigint AS wins,
        now()
      FROM matches m
      JOIN match_participants p ON p.match_id = m.match_id
      WHERE m.queue_id = 420
      GROUP BY m.patch, m.region, m.queue_id, m.rank_bracket, p.role, p.champion_id
      ON CONFLICT (patch, region, queue_id, rank_bracket, role, champion_id)
      DO UPDATE SET
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = now()
    `;

    // ALL roles stats
    await this.prisma.$executeRaw`
      INSERT INTO champion_stats (patch, region, queue_id, rank_bracket, role, champion_id, games, wins, updated_at)
      SELECT
        m.patch,
        m.region,
        m.queue_id,
        m.rank_bracket,
        'ALL' AS role,
        p.champion_id,
        COUNT(*)::bigint AS games,
        SUM(CASE WHEN p.win THEN 1 ELSE 0 END)::bigint AS wins,
        now()
      FROM matches m
      JOIN match_participants p ON p.match_id = m.match_id
      WHERE m.queue_id = 420
      GROUP BY m.patch, m.region, m.queue_id, m.rank_bracket, p.champion_id
      ON CONFLICT (patch, region, queue_id, rank_bracket, role, champion_id)
      DO UPDATE SET
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        updated_at = now()
    `;

    this.logger.log('Champion stats computed');
  }

  /**
   * Step C: Compute ban stats (banned_matches per champion per bucket)
   */
  private async computeBanStats() {
    this.logger.log('Computing ban stats...');

    await this.prisma.$executeRaw`
      WITH banned AS (
        SELECT
          m.patch, m.region, m.queue_id, m.rank_bracket,
          b.champion_id,
          COUNT(DISTINCT m.match_id)::bigint AS banned_matches
        FROM matches m
        JOIN match_bans b ON b.match_id = m.match_id
        WHERE m.queue_id = 420
        GROUP BY m.patch, m.region, m.queue_id, m.rank_bracket, b.champion_id
      )
      UPDATE champion_stats cs
      SET banned_matches = b.banned_matches,
          updated_at = now()
      FROM banned b
      WHERE cs.patch = b.patch
        AND cs.region = b.region
        AND cs.queue_id = b.queue_id
        AND cs.rank_bracket = b.rank_bracket
        AND cs.champion_id = b.champion_id
        AND cs.role = 'ALL'
    `;

    this.logger.log('Ban stats computed');
  }

  /**
   * Manual trigger for aggregation (useful for testing or on-demand updates)
   */
  async triggerAggregation() {
    this.logger.log('Manually triggering aggregation...');
    await this.aggregateChampionStats();
  }
}
