import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { IngestionService } from './ingestion.service';
import { AggregationService } from './aggregation.service';
import { PublicChampionSeedService } from './public-champion-seed.service';
import { BatchSeedService } from './batch-seed.service';
import { MatchClient, SummonerClient } from '@league-voice/riot';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    ...(process.env.USE_REDIS !== 'false'
      ? [
          BullModule.registerQueue({
            name: 'match-ingestion',
          }),
          BullModule.registerQueue({
            name: 'analytics-aggregation',
          }),
        ]
      : []),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    IngestionService,
    AggregationService,
    PublicChampionSeedService,
    BatchSeedService,
    {
      provide: MatchClient,
      useFactory: (configService: ConfigService) => {
        return new MatchClient({
          apiKey: configService.get<string>('RIOT_API_KEY', ''),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: SummonerClient,
      useFactory: (configService: ConfigService) => {
        return new SummonerClient({
          apiKey: configService.get<string>('RIOT_API_KEY', ''),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
