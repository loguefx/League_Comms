import axios, { AxiosInstance } from 'axios';
import type { Region } from '@league-voice/shared';

export interface RSOConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface RSOTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RSOAccountInfo {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export class RSOClient {
  private axios: AxiosInstance;
  private config: RSOConfig;

  constructor(config: RSOConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: 'https://auth.riotgames.com',
    });
  }

  /**
   * Generate the Riot OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid account',
      ...(state && { state }),
    });

    return `https://auth.riotgames.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<RSOTokens> {
    try {
      const response = await this.axios.post<RSOTokens>(
        '/oauth2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
        }),
        {
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ RSO Token Exchange Error:');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Client ID:', this.config.clientId);
        console.error('  Redirect URI:', this.config.redirectUri);
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid Client ID or Client Secret. Check your RIOT_CLIENT_ID and RIOT_CLIENT_SECRET in .env`);
        }
        if (error.response.status === 400) {
          throw new Error(`Bad Request (400): ${error.response.data?.error_description || error.response.data?.error || 'Invalid request'}`);
        }
        throw new Error(`RSO Token Exchange failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<RSOTokens> {
    try {
      const response = await this.axios.post<RSOTokens>(
        '/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        {
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ RSO Token Refresh Error:');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid refresh token or credentials`);
        }
        throw new Error(`RSO Token Refresh failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get account information (PUUID, Riot ID) using access token
   */
  async getAccountInfo(accessToken: string, region: Region): Promise<RSOAccountInfo> {
    try {
      // Get userinfo from OAuth endpoint
      const userInfoResponse = await this.axios.get<{ sub: string }>(
        'https://auth.riotgames.com/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const puuid = userInfoResponse.data.sub;

      // Get Riot ID from Account API
      // Note: Account API v1 uses OAuth Bearer tokens, not API keys
      const accountResponse = await this.axios.get<{
        puuid: string;
        gameName: string;
        tagLine: string;
      }>(
        `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        puuid,
        gameName: accountResponse.data.gameName,
        tagLine: accountResponse.data.tagLine,
      };
    } catch (error: any) {
      if (error.response) {
        console.error('❌ RSO Get Account Info Error:');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  Access Token (first 20 chars):', accessToken?.substring(0, 20) + '...');
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid or expired access token. Token may need to be refreshed.`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): Access token doesn't have required permissions for Account API`);
        }
        throw new Error(`RSO Get Account Info failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }
}
