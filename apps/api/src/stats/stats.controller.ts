import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SummonerClient } from '@league-voice/riot';
import { ConfigService } from '@nestjs/config';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(
    private statsService: StatsService,
    private prisma: PrismaService,
    private summonerClient: SummonerClient,
    private configService: ConfigService
  ) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.statsService.getPlayerStats(req.user.userId);
  }

  @Get('profile/:puuid')
  async getProfileByPuuid(@Param('puuid') puuid: string) {
    // Public profile endpoint (with privacy checks)
    const user = await this.prisma.user.findFirst({
      where: {
        riotAccount: { puuid },
      },
      include: {
        settings: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check privacy settings
    if (user.settings?.privacyFlags && (user.settings.privacyFlags as any).hideProfile) {
      throw new Error('Profile is private');
    }

    return this.statsService.getPlayerStats(user.id);
  }

  @Get('by-summoner/:summonerName')
  async getStatsBySummonerName(
    @Param('summonerName') summonerName: string,
    @Request() req: any
  ) {
    // Get user's region to know which region to query
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { riotAccount: true },
    });

    if (!user || !user.riotAccount) {
      throw new Error('User not linked to Riot account');
    }

    // Get summoner by name
    const summoner = await this.summonerClient.getSummonerByName(
      user.riotAccount.region as any,
      summonerName
    );

    // Get stats by PUUID
    return this.statsService.getPlayerStatsByPuuid(summoner.puuid, user.riotAccount.region);
  }
}
