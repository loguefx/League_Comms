import { z } from 'zod';

// Region validation
export const regionSchema = z.enum([
  'na1',
  'euw1',
  'eun1',
  'kr',
  'br1',
  'la1',
  'la2',
  'oc1',
  'ru',
  'tr1',
  'jp1',
  'ph2', // Philippines
  'sg2', // Singapore
  'th2', // Thailand
  'tw2', // Taiwan
  'vn2', // Vietnam
]);

// Rank validation
export const rankTierSchema = z.enum([
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
]);

export const rankDivisionSchema = z.enum(['I', 'II', 'III', 'IV']);

export const roleSchema = z.enum(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']);

// Riot ID validation
export const riotIdSchema = z.object({
  gameName: z.string().min(1).max(16),
  tagLine: z.string().min(1).max(5),
});

// PUUID validation
export const puuidSchema = z.string().uuid();

// Voice room key validation
export const roomKeySchema = z.string().regex(/^[a-z0-9]+:[0-9]+:(100|200)$/);

// User settings validation
export const userSettingsSchema = z.object({
  autoJoinVoice: z.boolean().default(true),
  pttKey: z.string().optional(),
  privacyFlags: z
    .object({
      hideProfile: z.boolean().optional(),
    })
    .default({}),
  uiPrefs: z
    .object({
      theme: z.enum(['light', 'dark']).optional(),
    })
    .default({}),
});

// Analytics query validation
export const analyticsQuerySchema = z.object({
  rank: z.string().optional(),
  role: roleSchema.optional(),
  patch: z.string().optional(),
});
