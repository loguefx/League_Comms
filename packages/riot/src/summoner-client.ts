import axios, { AxiosInstance } from 'axios';
import type { Region } from '@league-voice/shared';

export interface SummonerConfig {
  apiKey: string;
}

export interface Summoner {
  id: string; // Encrypted summoner ID
  accountId: string; // Encrypted account ID
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface LeagueEntry {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export class SummonerClient {
  private axios: AxiosInstance;
  private config: SummonerConfig;

  constructor(config: SummonerConfig) {
    this.config = config;
    this.axios = axios.create();
  }

  /**
   * Get summoner by encrypted summoner ID
   */
  async getSummonerById(region: Region, encryptedSummonerId: string): Promise<Summoner> {
    const response = await this.axios.get<Summoner>(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${encryptedSummonerId}`,
      {
        headers: {
          'X-Riot-Token': this.config.apiKey,
        },
      }
    );

    return response.data;
  }

  /**
   * Get summoner by PUUID
   */
  async getSummonerByPuuid(region: Region, puuid: string): Promise<Summoner> {
    const response = await this.axios.get<Summoner>(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: {
          'X-Riot-Token': this.config.apiKey,
        },
      }
    );

    return response.data;
  }

  /**
   * Get summoner by name
   */
  async getSummonerByName(region: Region, summonerName: string): Promise<Summoner> {
    const response = await this.axios.get<Summoner>(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      {
        headers: {
          'X-Riot-Token': this.config.apiKey,
        },
      }
    );

    return response.data;
  }

  /**
   * Get league entries for a summoner
   */
  async getLeagueEntries(region: Region, encryptedSummonerId: string): Promise<LeagueEntry[]> {
    const response = await this.axios.get<LeagueEntry[]>(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
      {
        headers: {
          'X-Riot-Token': this.config.apiKey,
        },
      }
    );

    return response.data;
  }
}
