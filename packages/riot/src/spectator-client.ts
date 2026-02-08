import axios, { AxiosInstance } from 'axios';
import type { Region, ActiveGame, GameParticipant } from '@league-voice/shared';

export interface SpectatorConfig {
  apiKey: string;
}

export class SpectatorClient {
  private axios: AxiosInstance;
  private config: SpectatorConfig;

  constructor(config: SpectatorConfig) {
    this.config = config;
    this.axios = axios.create();
  }

  /**
   * Get active game for a summoner by encrypted summoner ID
   */
  async getActiveGameBySummonerId(
    region: Region,
    encryptedSummonerId: string
  ): Promise<ActiveGame | null> {
    try {
      const response = await this.axios.get<ActiveGame>(
        `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${encryptedSummonerId}?api_key=${this.config.apiKey}`
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          // No active game - this is normal
          return null;
        }
        
        console.error('❌ Spectator API Error (getActiveGameBySummonerId):');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  Summoner ID:', encryptedSummonerId);
        console.error('  API Key (first 10 chars):', this.config.apiKey?.substring(0, 10) + '...');
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid API key`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): API key doesn't have access to Spectator API`);
        }
        throw new Error(`Spectator API call failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get active game for a summoner by PUUID
   * Note: This requires first getting the summoner ID from the PUUID
   */
  async getActiveGameByPuuid(
    region: Region,
    puuid: string,
    getSummonerId: (puuid: string) => Promise<string>
  ): Promise<ActiveGame | null> {
    const summonerId = await getSummonerId(puuid);
    return this.getActiveGameBySummonerId(region, summonerId);
  }

  /**
   * Extract team participants from active game
   */
  getTeamParticipants(game: ActiveGame, teamId: 100 | 200): GameParticipant[] {
    return game.participants.filter((p) => p.teamId === teamId);
  }

  /**
   * Get user's team ID from active game by summoner ID
   */
  getUserTeamId(game: ActiveGame, encryptedSummonerId: string): 100 | 200 | null {
    const participant = game.participants.find((p) => p.summonerId === encryptedSummonerId);
    return participant ? (participant.teamId as 100 | 200) : null;
  }
}
