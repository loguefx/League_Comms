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
        `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${encryptedSummonerId}`,
        {
          headers: {
            'X-Riot-Token': this.config.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // No active game
        return null;
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
