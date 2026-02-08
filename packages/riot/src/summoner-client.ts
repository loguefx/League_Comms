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
  summonerId?: string; // Optional - newer API responses may not include this
  puuid?: string; // Optional - some API responses include PUUID directly
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
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${encryptedSummonerId}?api_key=${this.config.apiKey}`
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
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${this.config.apiKey}`
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
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}?api_key=${this.config.apiKey}`
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
   * Get challenger league entries
   */
  async getChallengerLeague(region: Region, queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' = 'RANKED_SOLO_5x5'): Promise<{ entries: LeagueEntry[] }> {
    try {
      const response = await this.axios.get<{ entries: LeagueEntry[] }>(
        `https://${region}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queue}?api_key=${this.config.apiKey}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ League API Error (getChallengerLeague):');
        console.error('  Status:', error.response.status);
        throw new Error(`Failed to get challenger league: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * Get grandmaster league entries
   */
  async getGrandmasterLeague(region: Region, queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' = 'RANKED_SOLO_5x5'): Promise<{ entries: LeagueEntry[] }> {
    try {
      const response = await this.axios.get<{ entries: LeagueEntry[] }>(
        `https://${region}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/${queue}?api_key=${this.config.apiKey}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ League API Error (getGrandmasterLeague):');
        console.error('  Status:', error.response.status);
        throw new Error(`Failed to get grandmaster league: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * Get master league entries
   */
  async getMasterLeague(region: Region, queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' = 'RANKED_SOLO_5x5'): Promise<{ entries: LeagueEntry[] }> {
    try {
      const response = await this.axios.get<{ entries: LeagueEntry[] }>(
        `https://${region}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/${queue}?api_key=${this.config.apiKey}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ League API Error (getMasterLeague):');
        console.error('  Status:', error.response.status);
        throw new Error(`Failed to get master league: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * Get league entries by tier and division
   * This is the key endpoint for getting players from all ranks
   * @param region - The region code
   * @param queue - Queue type (RANKED_SOLO_5x5 or RANKED_FLEX_SR)
   * @param tier - Rank tier (IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
   * @param division - Division (I, II, III, IV) - not used for MASTER, GRANDMASTER, CHALLENGER
   * @param page - Page number (default: 1, max: usually 1-10 pages per tier/division)
   */
  async getLeagueEntriesByTier(
    region: Region,
    queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR',
    tier: string,
    division: string = 'I',
    page: number = 1
  ): Promise<LeagueEntry[]> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('api_key', this.config.apiKey);

      const response = await this.axios.get<LeagueEntry[]>(
        `https://${region}.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ League API Error (getLeagueEntriesByTier):');
        console.error('  Status:', error.response.status);
        console.error('  Tier:', tier, 'Division:', division, 'Page:', page);
        throw new Error(`Failed to get league entries: ${error.response.status}`);
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
        `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}?api_key=${this.config.apiKey}`
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
