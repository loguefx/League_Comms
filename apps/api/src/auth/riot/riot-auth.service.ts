import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { RSOClient } from '@league-voice/riot';
import * as crypto from 'crypto';

@Injectable()
export class RiotAuthService {
  private encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private rsoClient: RSOClient,
    private configService: ConfigService
  ) {
    // In production, use a proper key management system
    this.encryptionKey = configService.get<string>('ENCRYPTION_KEY', 'dev-key-change-in-production');
  }

  async getAuthorizationUrl(state?: string): Promise<string> {
    return this.rsoClient.getAuthorizationUrl(state);
  }

  async handleCallback(code: string, state?: string): Promise<{ token: string }> {
    try {
      console.log('Exchanging authorization code for tokens...');
      // Exchange code for tokens
      const tokens = await this.rsoClient.exchangeCodeForTokens(code);
      console.log('Tokens received, expires in:', tokens.expiresIn, 'seconds');

      // Get account info (PUUID, Riot ID)
      // We need to determine region - for now, try to get from state or use default
      const region = state?.split(':')[0] || 'na1';
      console.log('Getting account info for region:', region);
      const accountInfo = await this.rsoClient.getAccountInfo(tokens.accessToken, region as any);
      console.log('Account info received:', { puuid: accountInfo.puuid, gameName: accountInfo.gameName });

    // Encrypt tokens
    const encryptedTokens = this.encryptTokens(tokens);

    // Calculate token expiry
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokens.expiresIn);

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        riotAccount: {
          puuid: accountInfo.puuid,
        },
      },
      include: { riotAccount: true },
    });

    if (!user) {
      // Create new user and Riot account
      const newUser = await this.prisma.user.create({
        data: {
          riotAccount: {
            create: {
              puuid: accountInfo.puuid,
              gameName: accountInfo.gameName,
              tagLine: accountInfo.tagLine,
              region,
              encryptedTokens: encryptedTokens as any,
              tokenExpiresAt,
            },
          },
          settings: {
            create: {
              autoJoinVoice: true,
              privacyFlags: JSON.stringify({}),
              uiPrefs: JSON.stringify({}),
            },
          },
        },
        include: { riotAccount: true },
      });
      user = newUser;
    } else {
      // Update existing Riot account
      await this.prisma.riotAccount.update({
        where: { userId: user.id },
        data: {
          gameName: accountInfo.gameName,
          tagLine: accountInfo.tagLine,
          region,
          encryptedTokens,
          tokenExpiresAt,
        },
      });
    }

      // Create session
      console.log('Creating session for user:', user.id);
      const session = await this.authService.createSession(user.id);
      console.log('Session created successfully');

      return { token: session.token };
    } catch (error: any) {
      console.error('Error in handleCallback:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      throw new Error(
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message ||
        'Failed to authenticate with Riot Games'
      );
    }
  }

  async getRiotAccountStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { riotAccount: true },
    });

    if (!user || !user.riotAccount) {
      return { connected: false };
    }

    return {
      connected: true,
      riotId: `${user.riotAccount.gameName}#${user.riotAccount.tagLine}`,
      region: user.riotAccount.region,
    };
  }

  async getAccessToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { riotAccount: true },
    });

    if (!user || !user.riotAccount) {
      return null;
    }

    // Check if token is expired
    if (user.riotAccount.tokenExpiresAt < new Date()) {
      // Refresh token
      const tokens = this.decryptTokens(user.riotAccount.encryptedTokens as any);
      const newTokens = await this.rsoClient.refreshTokens(tokens.refreshToken);

      // Update stored tokens
      const encryptedTokens = this.encryptTokens(newTokens);
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + newTokens.expiresIn);

      await this.prisma.riotAccount.update({
        where: { userId },
        data: {
          encryptedTokens,
          tokenExpiresAt,
        },
      });

      return newTokens.accessToken;
    }

    const tokens = this.decryptTokens(user.riotAccount.encryptedTokens as any);
    return tokens.accessToken;
  }

  private encryptTokens(tokens: { accessToken: string; refreshToken: string }): any {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(tokens), 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  private decryptTokens(encrypted: {
    encrypted: string;
    iv: string;
    authTag: string;
  }): { accessToken: string; refreshToken: string } {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted.encrypted, 'base64'),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}
