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
    try {
      const response = await this.axios.get<Summoner>(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${encryptedSummonerId}`,
        {
          headers: {
            'X-Riot-Token': this.config.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ Summoner API Error (getSummonerById):');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  Summoner ID:', encryptedSummonerId);
        console.error('  API Key (first 10 chars):', this.config.apiKey?.substring(0, 10) + '...');
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid API key. Check your RIOT_API_KEY in .env`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): API key doesn't have access to this endpoint or is blacklisted`);
        }
        if (error.response.status === 404) {
          throw new Error(`Not Found (404): Summoner not found`);
        }
        throw new Error(`Summoner API call failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get summoner by PUUID
   */
  async getSummonerByPuuid(region: Region, puuid: string): Promise<Summoner> {
    try {
      const response = await this.axios.get<Summoner>(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        {
          headers: {
            'X-Riot-Token': this.config.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ Summoner API Error (getSummonerByPuuid):');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  PUUID:', puuid);
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid API key`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): API key doesn't have access`);
        }
        if (error.response.status === 404) {
          throw new Error(`Not Found (404): Summoner not found for this PUUID`);
        }
        throw new Error(`Summoner API call failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get summoner by name
   */
  async getSummonerByName(region: Region, summonerName: string): Promise<Summoner> {
    try {
      const response = await this.axios.get<Summoner>(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
        {
          headers: {
            'X-Riot-Token': this.config.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ Summoner API Error (getSummonerByName):');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  Summoner Name:', summonerName);
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid API key`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): API key doesn't have access`);
        }
        if (error.response.status === 404) {
          throw new Error(`Not Found (404): Summoner "${summonerName}" not found`);
        }
        throw new Error(`Summoner API call failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get league entries for a summoner
   */
  async getLeagueEntries(region: Region, encryptedSummonerId: string): Promise<LeagueEntry[]> {
    try {
      const response = await this.axios.get<LeagueEntry[]>(
        `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
        {
          headers: {
            'X-Riot-Token': this.config.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ League API Error (getLeagueEntries):');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  Summoner ID:', encryptedSummonerId);
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid API key`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): API key doesn't have access`);
        }
        if (error.response.status === 404) {
          throw new Error(`Not Found (404): League entries not found`);
        }
        throw new Error(`League API call failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }
}
