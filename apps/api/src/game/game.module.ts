import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameDetectionService } from './game-detection.service';
import { GameGateway } from './game.gateway';
import { GameController } from './game.controller';
import { SpectatorClient, SummonerClient } from '@league-voice/riot';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { GameQueueProcessor } from './game-queue.processor';
import { RiotAuthModule } from '../auth/riot/riot-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    RiotAuthModule,
    BullModule.registerQueue({
      name: 'game-detection',
    }),
  ],
  controllers: [GameController],
  providers: [
    GameDetectionService,
    GameGateway,
    GameQueueProcessor,
    {
      provide: SpectatorClient,
      useFactory: (configService: ConfigService) => {
        return new SpectatorClient({
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
  exports: [GameDetectionService],
})
export class GameModule {}
