import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RiotAuthService } from './riot-auth.service';
import { SpectatorClient, SummonerClient } from '@league-voice/riot';

@Controller('auth/riot/test')
export class RiotTestController {
  constructor(
    private riotAuthService: RiotAuthService,
    private configService: ConfigService
  ) {}

  @Get('config')
  async testConfig() {
    const clientId = this.configService.get<string>('RIOT_CLIENT_ID');
    const hasClientSecret = !!this.configService.get<string>('RIOT_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('RIOT_REDIRECT_URI');
    const apiKey = this.configService.get<string>('RIOT_API_KEY');

    return {
      hasClientId: !!clientId,
      hasClientSecret,
      redirectUri,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      // Don't expose actual secrets
      clientIdPreview: clientId ? `${clientId.substring(0, 3)}...` : 'Not set',
    };
  }

  @Get('connection')
  @UseGuards(JwtAuthGuard)
  async testConnection() {
    try {
      // Test if we can get access token
      const userId = 'test'; // This will fail but we can see the error
      try {
        const token = await this.riotAuthService.getAccessToken(userId);
        return {
          success: true,
          hasAccessToken: !!token,
          message: 'Can retrieve access token',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Cannot retrieve access token (user may not be linked)',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('api-key')
  async testApiKey() {
    const apiKey = this.configService.get<string>('RIOT_API_KEY');
    
    if (!apiKey) {
      return {
        success: false,
        error: 'RIOT_API_KEY not set in environment',
      };
    }

    try {
      // Test API key by making a simple request
      const summonerClient = new SummonerClient({ apiKey });
      // This will fail with 404 if API key is invalid, or succeed if valid
      // We'll just check if the client can be created
      return {
        success: true,
        message: 'API key is configured',
        apiKeyLength: apiKey.length,
        note: 'API key validity can only be tested with actual API calls',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('oauth-url')
  async getOAuthUrl() {
    const clientId = this.configService.get<string>('RIOT_CLIENT_ID');
    const redirectUri = this.configService.get<string>('RIOT_REDIRECT_URI');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    if (!clientId || !redirectUri) {
      return {
        success: false,
        error: 'OAuth credentials not configured',
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
      };
    }

    try {
      const oauthUrl = await this.riotAuthService.getAuthorizationUrl();
      return {
        success: true,
        oauthUrl,
        clientId,
        redirectUri,
        frontendUrl,
        message: 'Copy the oauthUrl and open it in your browser to test OAuth',
        troubleshooting: {
          issue: 'If you get "An error occurred!" from Riot, the redirect URI is not registered',
          solution1: 'Try using localhost instead: Change RIOT_REDIRECT_URI to http://localhost:4000/auth/riot/callback',
          solution2: 'Contact Riot Support to register your redirect URI',
          note: 'Many OAuth providers allow localhost redirect URIs without registration',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
