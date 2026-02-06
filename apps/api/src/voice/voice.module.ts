import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RiotAuthModule } from '../auth/riot/riot-auth.module';
import { GameModule } from '../game/game.module';
import { AccessToken } from 'livekit-server-sdk';

@Module({
  imports: [ConfigModule, PrismaModule, RiotAuthModule, GameModule],
  controllers: [VoiceController],
  providers: [
    VoiceService,
    {
      provide: 'LIVEKIT_CONFIG',
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get<string>('LIVEKIT_API_KEY', 'devkey'),
        apiSecret: configService.get<string>('LIVEKIT_API_SECRET', 'devsecret'),
        url: configService.get<string>('LIVEKIT_URL', 'http://localhost:7880'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [VoiceService],
})
export class VoiceModule {}
