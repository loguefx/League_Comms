import type { Region } from '../types';

// Riot API Regions
export const RIOT_REGIONS: Record<string, Region> = {
  NA: 'na1',
  EUW: 'euw1',
  EUNE: 'eun1',
  KR: 'kr',
  BR: 'br1',
  LAN: 'la1',
  LAS: 'la2',
  OCE: 'oc1',
  RU: 'ru',
  TR: 'tr1',
  JP: 'jp1',
} as const;

// Rank tier groupings for analytics
export const RANK_TIER_GROUPS = {
  EMERALD_PLUS: ['EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
  PLATINUM_PLUS: ['PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
  DIAMOND_PLUS: ['DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
} as const;

// Team IDs
export const TEAM_IDS = {
  BLUE: '100',
  RED: '200',
} as const;

// Game constants
export const GAME_DURATION_ESTIMATE_MS = 30 * 60 * 1000; // 30 minutes
export const ACTIVE_GAME_POLL_INTERVAL_MS = 12 * 1000; // 12 seconds
export const MATCH_HISTORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Riot API Rate Limits (approximate, adjust based on actual limits)
export const RIOT_RATE_LIMITS = {
  DEVELOPMENT: {
    requestsPerSecond: 20,
    requestsPerMinute: 100,
  },
  PRODUCTION: {
    requestsPerSecond: 20,
    requestsPerMinute: 100,
  },
} as const;

// Voice room expiry (match duration + buffer)
export const VOICE_ROOM_EXPIRY_MS = GAME_DURATION_ESTIMATE_MS + 5 * 60 * 1000; // 35 minutes
