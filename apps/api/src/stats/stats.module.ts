import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { MatchHistoryService } from './match-history.service';
import { MatchHistoryController } from './match-history.controller';
import { MatchClient, SummonerClient } from '@league-voice/riot';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { RiotAuthModule } from '../auth/riot/riot-auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, AuthModule, RiotAuthModule],
  controllers: [StatsController, MatchHistoryController],
  providers: [
    StatsService,
    MatchHistoryService,
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
  exports: [StatsService],
})
export class StatsModule {}
