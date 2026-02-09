// Champion data from Riot Data Dragon API
// This file provides utilities to fetch and use champion data

interface ChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
  };
}

interface ChampionDataResponse {
  data: Record<string, ChampionData>;
}

// Cache for champion data
let championDataCache: Record<number, ChampionData> | null = null;
let latestVersion: string | null = null;

/**
 * Fetch the latest Data Dragon version
 */
async function fetchLatestVersion(): Promise<string> {
  try {
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions: string[] = await response.json();
    return versions[0]; // Latest version
  } catch (error) {
    console.error('Failed to fetch Data Dragon version:', error);
    return '14.1.1'; // Fallback version
  }
}

/**
 * Get latest Data Dragon version (exported for use in other modules)
 */
export async function getLatestDataDragonVersion(): Promise<string> {
  if (latestVersion) {
    return latestVersion;
  }
  latestVersion = await fetchLatestVersion();
  return latestVersion;
}

/**
 * Fetch champion data from Data Dragon
 */
async function fetchChampionData(): Promise<Record<number, ChampionData>> {
  if (championDataCache) {
    return championDataCache;
  }

  try {
    if (!latestVersion) {
      latestVersion = await fetchLatestVersion();
    }

    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
    );
    const data: ChampionDataResponse = await response.json();

    // Convert to map by champion ID (key is string ID, we need numeric)
    const championMap: Record<number, ChampionData> = {};
    Object.values(data.data).forEach((champion) => {
      const championId = parseInt(champion.key, 10);
      if (!isNaN(championId)) {
        championMap[championId] = champion;
      }
    });

    championDataCache = championMap;
    return championMap;
  } catch (error) {
    console.error('Failed to fetch champion data:', error);
    return {};
  }
}

/**
 * Get champion name by ID
 */
export async function getChampionName(championId: number): Promise<string> {
  const championData = await fetchChampionData();
  return championData[championId]?.name || `Champion ${championId}`;
}

/**
 * Get champion name synchronously (uses cache if available)
 */
export function getChampionNameSync(championId: number): string {
  if (championDataCache && championDataCache[championId]) {
    return championDataCache[championId].name;
  }
  return `Champion ${championId}`;
}

/**
 * Get champion image URL by ID
 */
export function getChampionImageUrl(championId: number, version?: string): string {
  const championData = championDataCache;
  if (championData && championData[championId]) {
    const championKey = championData[championId].id;
    const v = version || latestVersion || '14.1.1';
    return `https://ddragon.leagueoflegends.com/cdn/${v}/img/champion/${championKey}.png`;
  }
  // Fallback: try to construct URL from champion ID (less reliable)
  return `https://ddragon.leagueoflegends.com/cdn/${version || latestVersion || '14.1.1'}/img/champion/Unknown.png`;
}

/**
 * Preload champion data (call this on app initialization)
 */
export async function preloadChampionData(): Promise<void> {
  await fetchChampionData();
}

/**
 * Calculate tier based on win rate and pick rate (U.GG-style)
 * Tiers: S+, S, A, B, C, D
 * 
 * This uses a more nuanced approach:
 * - Very low sample size (< 10 games) = D tier (unreliable)
 * - Low sample size (10-49 games) = Capped at B tier (less reliable but still useful)
 * - Normal sample size (50+ games) = Full tier range
 */
export function calculateTier(winRate: number, pickRate: number, games: number): string {
  // Very low sample size - unreliable, always D tier
  if (games < 10) {
    return 'D';
  }

  // Base tier score on win rate (winRate is already a percentage 0-100)
  let tierScore = winRate;

  // Adjust for pick rate (popular champs are harder to maintain high WR, so they get a boost)
  // This accounts for the fact that high pick rate champs face more counter-picks
  if (pickRate > 10) {
    tierScore += 2; // Very popular champs get boost
  } else if (pickRate > 5) {
    tierScore += 1; // Popular champs get small boost
  } else if (pickRate < 1) {
    tierScore -= 1; // Very niche picks get penalty (might be off-meta)
  }

  // Adjust for sample size confidence
  if (games >= 1000) {
    tierScore += 1; // Very high confidence
  } else if (games >= 500) {
    tierScore += 0.5; // High confidence
  } else if (games < 200) {
    tierScore -= 1; // Lower confidence
  } else if (games < 50) {
    tierScore -= 2; // Much lower confidence
  }

  // Determine tier with adjusted thresholds
  // For low sample size (10-49 games), cap at B tier
  if (games < 50) {
    // Low sample size - be conservative, cap at B tier
    if (tierScore >= 52) return 'B';
    if (tierScore >= 50) return 'C';
    return 'D';
  }

  // Normal sample size (50+ games) - full tier range
  if (tierScore >= 55) return 'S+';
  if (tierScore >= 53) return 'S';
  if (tierScore >= 51) return 'A';
  if (tierScore >= 49) return 'B';
  if (tierScore >= 47) return 'C';
  return 'D';
}

/**
 * Get tier color for display
 */
export function getTierColor(tier: string): string {
  switch (tier) {
    case 'S+':
      return 'text-yellow-400';
    case 'S':
      return 'text-yellow-500';
    case 'A':
      return 'text-green-400';
    case 'B':
      return 'text-blue-400';
    case 'C':
      return 'text-purple-400';
    case 'D':
      return 'text-gray-400';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get tier background color for badges
 */
export function getTierBgColor(tier: string): string {
  switch (tier) {
    case 'S+':
      return 'bg-yellow-500/20 border-yellow-500/50';
    case 'S':
      return 'bg-yellow-600/20 border-yellow-600/50';
    case 'A':
      return 'bg-green-500/20 border-green-500/50';
    case 'B':
      return 'bg-blue-500/20 border-blue-500/50';
    case 'C':
      return 'bg-purple-500/20 border-purple-500/50';
    case 'D':
      return 'bg-gray-500/20 border-gray-500/50';
    default:
      return 'bg-gray-500/20 border-gray-500/50';
  }
}

// Role order for display (Top, Jungle, Mid, ADC, Support)
export const ROLE_ORDER = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const;

// Spell ID to name mapping
export const SUMMONER_SPELLS: Record<number, string> = {
  1: 'Cleanse',
  3: 'Exhaust',
  4: 'Flash',
  6: 'Ghost',
  7: 'Heal',
  11: 'Smite',
  12: 'Teleport',
  13: 'Clarity',
  14: 'Ignite',
  21: 'Barrier',
  30: 'Poro Recall',
  31: 'Poro Throw',
  32: 'Mark',
  39: 'Mark',
  54: 'Clarity',
  55: 'Clarity',
};

export function getSpellName(spellId: number): string {
  return SUMMONER_SPELLS[spellId] || `Spell ${spellId}`;
}
