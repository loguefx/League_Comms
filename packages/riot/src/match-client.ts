import axios, { AxiosInstance } from 'axios';
import type { Region } from '@league-voice/shared';

export interface MatchConfig {
  apiKey: string;
}

export interface Match {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: MatchParticipant[];
    platformId: string;
    queueId: number;
    teams: MatchTeam[];
    tournamentCode?: string;
  };
}

export interface MatchParticipant {
  assists: number;
  baronKills: number;
  bountyLevel: number;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  championTransform: number;
  consumablesPurchased: number;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  deaths: number;
  detectorWardsPlaced: number;
  doubleKills: number;
  dragonKills: number;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  goldEarned: number;
  goldSpent: number;
  individualPosition: string; // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
  inhibitorKills: number;
  inhibitorTakedowns: number;
  inhibitorsLost: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased: number;
  killingSprees: number;
  kills: number;
  lane: string;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicDamageTaken: number;
  neutralMinionsKilled: number;
  nexusKills: number;
  nexusLost: number;
  nexusTakedowns: number;
  objectivesStolen: number;
  objectivesStolenAssists: number;
  participantId: number;
  pentaKills: number;
  perks: unknown;
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  profileIcon: number;
  puuid: string;
  quadraKills: number;
  riotIdName: string;
  riotIdTagline: string;
  role: string;
  sightWardsBoughtInGame: number;
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  summoner1Casts: number;
  summoner1Id: number;
  summoner2Casts: number;
  summoner2Id: number;
  summonerId: string;
  summonerLevel: number;
  summonerName: string;
  teamEarlySurrendered: boolean;
  teamId: number; // 100 or 200
  teamPosition: string;
  timeCCingOthers: number;
  timePlayed: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates: number;
  totalDamageTaken: number;
  totalHealOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  totalUnitsHealed: number;
  tripleKills: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
  turretKills: number;
  turretTakedowns: number;
  turretsLost: number;
  unrealKills: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
}

export interface MatchTeam {
  bans: Array<{
    championId: number;
    pickTurn: number;
  }>;
  objectives: {
    baron: { first: boolean; kills: number };
    champion: { first: boolean; kills: number };
    dragon: { first: boolean; kills: number };
    inhibitor: { first: boolean; kills: number };
    riftHerald: { first: boolean; kills: number };
    tower: { first: boolean; kills: number };
  };
  teamId: number; // 100 or 200
  win: boolean;
}

export class MatchClient {
  private axios: AxiosInstance;
  private config: MatchConfig;

  constructor(config: MatchConfig) {
    this.config = config;
    this.axios = axios.create();
  }

  /**
   * Get match by match ID
   */
  async getMatch(region: Region, matchId: string): Promise<Match> {
    try {
      const response = await this.axios.get<Match>(
        `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        {
          headers: {
            'X-Riot-Token': this.config.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ Match API Error (getMatch):');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  Match ID:', matchId);
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid API key`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): API key doesn't have access to Match API`);
        }
        if (error.response.status === 404) {
          throw new Error(`Not Found (404): Match not found`);
        }
        throw new Error(`Match API call failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get match list by PUUID
   */
  async getMatchList(
    region: Region,
    puuid: string,
    options?: {
      start?: number;
      count?: number;
      queue?: number;
      type?: string;
      startTime?: number;
      endTime?: number;
    }
  ): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      if (options?.start !== undefined) params.append('start', options.start.toString());
      if (options?.count !== undefined) params.append('count', options.count.toString());
      if (options?.queue !== undefined) params.append('queue', options.queue.toString());
      if (options?.type) params.append('type', options.type);
      if (options?.startTime !== undefined) params.append('startTime', options.startTime.toString());
      if (options?.endTime !== undefined) params.append('endTime', options.endTime.toString());

      const response = await this.axios.get<string[]>(
        `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`,
        {
          headers: {
            'X-Riot-Token': this.config.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('❌ Match API Error (getMatchList):');
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('  Region:', region);
        console.error('  PUUID:', puuid);
        console.error('  Options:', JSON.stringify(options, null, 2));
        
        if (error.response.status === 401) {
          throw new Error(`Unauthorized (401): Invalid API key`);
        }
        if (error.response.status === 403) {
          throw new Error(`Forbidden (403): API key doesn't have access to Match API`);
        }
        if (error.response.status === 404) {
          throw new Error(`Not Found (404): No matches found for this PUUID`);
        }
        throw new Error(`Match API call failed: ${error.response.status} ${error.response.statusText}`);
      }
      throw error;
    }
  }
}
