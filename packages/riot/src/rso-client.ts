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
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<RSOTokens> {
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
  }

  /**
   * Get account information (PUUID, Riot ID) using access token
   */
  async getAccountInfo(accessToken: string, region: Region): Promise<RSOAccountInfo> {
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
    const accountResponse = await this.axios.get<{
      puuid: string;
      gameName: string;
      tagLine: string;
    }>(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
      {
        headers: {
          'X-Riot-Token': accessToken,
        },
      }
    );

    return {
      puuid,
      gameName: accountResponse.data.gameName,
      tagLine: accountResponse.data.tagLine,
    };
  }
}
