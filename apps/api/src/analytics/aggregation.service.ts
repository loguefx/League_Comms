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
   * Scheduled aggregation - runs every 2 minutes
   * This ensures champion stats stay up-to-date as new matches are ingested
   */
  @Cron('*/2 * * * *') // Every 2 minutes using cron syntax
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
   * Ban stats are the same for all roles (a champion is banned regardless of role)
   * So we update ALL role entries with the same ban count
   * 
   * Works with both small and large datasets:
   * - With limited data: shows ban rates even if only a few matches have bans
   * - With lots of data: aggregates ban counts accurately
   */
  private async computeBanStats() {
    this.logger.log('Computing ban stats...');

    // First, check if we have any bans at all
    const totalBans = await this.prisma.matchBan.count();
    this.logger.log(`Total bans in match_bans table: ${totalBans}`);

    if (totalBans === 0) {
      this.logger.warn('No bans found in database - ban stats will be 0%');
      // Set all banned_matches to 0 explicitly
      await this.prisma.$executeRaw`
        UPDATE champion_stats
        SET banned_matches = 0,
            updated_at = now()
        WHERE banned_matches IS NULL OR banned_matches != 0
      `;
      return;
    }

    // Compute ban counts per champion per bucket
    // This works with both small and large datasets
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
      SET banned_matches = COALESCE(b.banned_matches, 0),
          updated_at = now()
      FROM banned b
      WHERE cs.patch = b.patch
        AND cs.region = b.region
        AND cs.queue_id = b.queue_id
        AND cs.rank_bracket = b.rank_bracket
        AND cs.champion_id = b.champion_id
    `;

    // Also set banned_matches to 0 for champions that have stats but no bans
    // This ensures ban_rate calculation works correctly (0 / total_matches = 0%)
    await this.prisma.$executeRaw`
      UPDATE champion_stats cs
      SET banned_matches = 0,
          updated_at = now()
      WHERE cs.banned_matches IS NULL
    `;

    // Log statistics
    const banStats = await this.prisma.$queryRaw<Array<{ total_bans: bigint; champions_with_bans: bigint }>>`
      SELECT 
        COUNT(*)::bigint AS total_bans,
        COUNT(DISTINCT champion_id)::bigint AS champions_with_bans
      FROM match_bans
    `;
    const championsWithBans = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT champion_id)::bigint AS count
      FROM champion_stats
      WHERE banned_matches > 0
    `;
    
    this.logger.log(`Ban stats computed. Total bans: ${banStats[0]?.total_bans || 0}, Unique champions banned: ${banStats[0]?.champions_with_bans || 0}, Champion stats with bans: ${championsWithBans[0]?.count || 0}`);
  }

  /**
   * Manual trigger for aggregation (useful for testing or on-demand updates)
   */
  async triggerAggregation() {
    this.logger.log('Manually triggering aggregation...');
    await this.aggregateChampionStats();
  }
}
