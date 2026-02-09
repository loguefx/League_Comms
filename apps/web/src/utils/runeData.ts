// Rune data utilities for fetching and displaying rune images from Data Dragon

interface RuneTreeData {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: Array<{
    runes: Array<{
      id: number;
      key: string;
      icon: string;
      name: string;
      shortDesc: string;
      longDesc: string;
    }>;
  }>;
}

interface RuneTreeResponse {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: Array<{
    runes: Array<{
      id: number;
      key: string;
      icon: string;
      name: string;
      shortDesc: string;
      longDesc: string;
    }>;
  }>;
}

interface RuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: Array<{
    runes: Array<{
      id: number;
      key: string;
      icon: string;
      name: string;
      shortDesc: string;
      longDesc: string;
    }>;
  }>;
}

let runeDataCache: {
  version: string;
  runeTree: RuneTree[];
  perkIdToRune: Map<number, { icon: string; name: string; styleId: number }>;
  statShardMap: Map<number, { icon: string; name: string }>;
} | null = null;

let latestVersion: string | null = null;

/**
 * Get latest Data Dragon version
 */
async function getLatestVersion(): Promise<string> {
  if (latestVersion) return latestVersion;
  
  try {
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions: string[] = await response.json();
    latestVersion = versions[0] || '14.1.1';
    return latestVersion;
  } catch (error) {
    console.error('Failed to fetch Data Dragon versions:', error);
    return '14.1.1';
  }
}

/**
 * Fetch and cache rune tree data from Data Dragon
 */
async function fetchRuneData(): Promise<void> {
  if (runeDataCache) return;

  try {
    const version = await getLatestVersion();
    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch rune data: ${response.status}`);
    }

    const runeTree: RuneTree[] = await response.json();
    
    if (!Array.isArray(runeTree)) {
      throw new Error('Invalid rune tree data format');
    }
    const perkIdToRune = new Map<number, { icon: string; name: string; styleId: number }>();
    const statShardMap = new Map<number, { icon: string; name: string }>();

    // Map all runes from all styles
    runeTree.forEach((style) => {
      style.slots.forEach((slot, slotIndex) => {
        slot.runes.forEach((rune) => {
          perkIdToRune.set(rune.id, {
            icon: rune.icon,
            name: rune.name,
            styleId: style.id,
          });
        });
      });
    });

    // Stat shards are fixed IDs
    // 5001: Adaptive Force, 5002: Armor, 5003: Magic Resist
    // 5005: Health, 5007: Attack Speed, 5008: Ability Haste
    const statShards: Array<{ id: number; icon: string; name: string }> = [
      { id: 5001, icon: 'StatModsAdaptiveForceIcon.png', name: 'Adaptive Force' },
      { id: 5002, icon: 'StatModsArmorIcon.png', name: 'Armor' },
      { id: 5003, icon: 'StatModsMagicResistIcon.png', name: 'Magic Resist' },
      { id: 5005, icon: 'StatModsHealthScalingIcon.png', name: 'Health' },
      { id: 5007, icon: 'StatModsAttackSpeedIcon.png', name: 'Attack Speed' },
      { id: 5008, icon: 'StatModsCDRScalingIcon.png', name: 'Ability Haste' },
    ];

    statShards.forEach((shard) => {
      statShardMap.set(shard.id, { icon: shard.icon, name: shard.name });
    });

    runeDataCache = {
      version,
      runeTree,
      perkIdToRune,
      statShardMap,
    };
    
    // Store version globally for other utilities
    if (typeof window !== 'undefined') {
      (window as any).__DD_VERSION__ = version;
    }
  } catch (error) {
    console.error('Failed to fetch rune data:', error);
    // Create empty cache to prevent repeated fetches
    runeDataCache = {
      version: '14.1.1',
      runeTree: [],
      perkIdToRune: new Map(),
      statShardMap: new Map(),
    };
  }
}

/**
 * Get rune image URL by perk ID
 */
export async function getRuneImageUrl(perkId: number): Promise<string> {
  await fetchRuneData();
  
  if (!runeDataCache) {
    return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/perk-images/StatMods/StatModsEmpty.png`;
  }

  const rune = runeDataCache.perkIdToRune.get(perkId);
  if (!rune) {
    console.warn(`Rune not found for perk ID: ${perkId}`);
    return `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/perk-images/StatMods/StatModsEmpty.png`;
  }

  // Data Dragon rune icon path structure
  // Icon path is like: "perk-images/Styles/7200_Domination/7201_PressTheAttack/7201_PressTheAttack.png"
  // We need to construct the full URL
  return `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/${rune.icon}`;
}

/**
 * Get rune name by perk ID
 */
export async function getRuneName(perkId: number): Promise<string> {
  await fetchRuneData();
  
  if (!runeDataCache) {
    return `Perk ${perkId}`;
  }

  const rune = runeDataCache.perkIdToRune.get(perkId);
  return rune?.name || `Perk ${perkId}`;
}

/**
 * Get rune style image URL by style ID
 */
export function getRuneStyleImageUrl(styleId: number): string {
  const styleMap: Record<number, string> = {
    8000: '7201_Precision.png',
    8100: '7200_Domination.png',
    8200: '7202_Sorcery.png',
    8300: '7204_Inspiration.png',
    8400: '7203_Whimsy.png',
  };
  
  const styleName = styleMap[styleId] || '7200_Domination.png';
  const version = runeDataCache?.version || '14.1.1';
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/${styleName}`;
}

/**
 * Get stat shard image URL by shard ID
 */
export async function getStatShardImageUrl(shardId: number): Promise<string> {
  await fetchRuneData();
  
  if (!runeDataCache) {
    return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/perk-images/StatMods/StatModsEmpty.png`;
  }

  const shard = runeDataCache.statShardMap.get(shardId);
  if (!shard) {
    console.warn(`Stat shard not found for ID: ${shardId}`);
    return `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/perk-images/StatMods/StatModsEmpty.png`;
  }

  return `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/perk-images/StatMods/${shard.icon}`;
}

/**
 * Get stat shard name by shard ID
 */
export async function getStatShardName(shardId: number): Promise<string> {
  await fetchRuneData();
  
  if (!runeDataCache) {
    return `Shard ${shardId}`;
  }

  const shard = runeDataCache.statShardMap.get(shardId);
  return shard?.name || `Shard ${shardId}`;
}

/**
 * Preload rune data (call this on app initialization)
 */
export async function preloadRuneData(): Promise<void> {
  await fetchRuneData();
}
