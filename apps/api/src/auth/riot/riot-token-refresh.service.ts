import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RiotAuthService } from './riot-auth.service';

@Injectable()
export class RiotTokenRefreshService {
  constructor(
    private prisma: PrismaService,
    private riotAuthService: RiotAuthService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async refreshExpiringTokens() {
    // Find tokens expiring in the next hour
    const expiringSoon = new Date();
    expiringSoon.setHours(expiringSoon.getHours() + 1);

    const accounts = await this.prisma.riotAccount.findMany({
      where: {
        tokenExpiresAt: {
          lte: expiringSoon,
        },
      },
      include: {
        user: true,
      },
    });

    for (const account of accounts) {
      try {
        // This will refresh the token if needed
        await this.riotAuthService.getAccessToken(account.userId);
      } catch (error) {
        console.error(`Failed to refresh token for user ${account.userId}:`, error);
      }
    }
  }
}
