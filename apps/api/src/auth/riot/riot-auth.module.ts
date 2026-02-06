import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RiotAuthController } from './riot-auth.controller';
import { RiotAuthService } from './riot-auth.service';
import { RiotTokenRefreshService } from './riot-token-refresh.service';
import { RSOClient } from '@league-voice/riot';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { AuthModule } from '../auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, AuthModule],
  controllers: [RiotAuthController],
  providers: [
    RiotAuthService,
    RiotTokenRefreshService,
    {
      provide: RSOClient,
      useFactory: (configService: ConfigService) => {
        return new RSOClient({
          clientId: configService.get<string>('RIOT_CLIENT_ID', ''),
          clientSecret: configService.get<string>('RIOT_CLIENT_SECRET', ''),
          redirectUri: configService.get<string>('RIOT_REDIRECT_URI', 'http://localhost:4000/auth/riot/callback'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RiotAuthService],
})
export class RiotAuthModule {}
