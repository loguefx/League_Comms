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
    
    console.log(`[fetchRuneData] Loaded ${runeTree.length} rune styles from Data Dragon version ${version}`);
    
    const perkIdToRune = new Map<number, { icon: string; name: string; styleId: number }>();
    const statShardMap = new Map<number, { icon: string; name: string }>();

    // Map all runes from all styles
    let totalRunes = 0;
    runeTree.forEach((style) => {
      if (!style.slots || !Array.isArray(style.slots)) {
        console.warn(`[fetchRuneData] Style ${style.id} has invalid slots:`, style);
        return;
      }
      style.slots.forEach((slot, slotIndex) => {
        if (!slot.runes || !Array.isArray(slot.runes)) {
          console.warn(`[fetchRuneData] Style ${style.id} slot ${slotIndex} has invalid runes:`, slot);
          return;
        }
        slot.runes.forEach((rune) => {
          if (!rune.id || !rune.icon || !rune.name) {
            console.warn(`[fetchRuneData] Invalid rune data:`, rune);
            return;
          }
          perkIdToRune.set(rune.id, {
            icon: rune.icon,
            name: rune.name,
            styleId: style.id,
          });
          totalRunes++;
        });
      });
    });
    
    console.log(`[fetchRuneData] Mapped ${totalRunes} runes, ${perkIdToRune.size} unique perk IDs`);

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
    console.error(`[getRuneImageUrl] Rune not found for perk ID: ${perkId}. Available runes:`, Array.from(runeDataCache.perkIdToRune.keys()).slice(0, 10));
    return `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/perk-images/StatMods/StatModsEmpty.png`;
  }

  // Data Dragon rune icon path structure
  // Icon path is like: "perk-images/Styles/7200_Domination/7201_PressTheAttack/7201_PressTheAttack.png"
  // We need to construct the full URL
  const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/${rune.icon}`;
  
  // Validate the icon path
  if (!rune.icon || rune.icon.trim() === '') {
    console.error(`[getRuneImageUrl] Empty icon path for perk ID: ${perkId}`, rune);
    return `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/perk-images/StatMods/StatModsEmpty.png`;
  }
  
  return imageUrl;
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
export async function getRuneStyleImageUrl(styleId: number): Promise<string> {
  // Ensure rune data is loaded first
  await fetchRuneData();
  
  if (!runeDataCache) {
    console.error(`[getRuneStyleImageUrl] Rune data cache is null for style ID: ${styleId}`);
    const version = (typeof window !== 'undefined' && (window as any).__DD_VERSION__) || '14.1.1';
    const styleMap: Record<number, string> = {
      8000: 'perk-images/Styles/7201_Precision/7201_Precision.png',
      8100: 'perk-images/Styles/7200_Domination/7200_Domination.png',
      8200: 'perk-images/Styles/7202_Sorcery/7202_Sorcery.png',
      8300: 'perk-images/Styles/7204_Inspiration/7204_Inspiration.png',
      8400: 'perk-images/Styles/7203_Whimsy/7203_Whimsy.png',
    };
    const stylePath = styleMap[styleId] || 'perk-images/Styles/7200_Domination/7200_Domination.png';
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/${stylePath}`;
  }
  
  // Data Dragon rune style images are in the rune tree data
  if (runeDataCache.runeTree.length > 0) {
    const style = runeDataCache.runeTree.find(s => s.id === styleId);
    if (style) {
      // Check if style has icon property
      if (style.icon) {
        const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${runeDataCache.version}/img/${style.icon}`;
        console.log(`[getRuneStyleImageUrl] Found style ${styleId} with icon: ${style.icon} -> ${imageUrl}`);
        return imageUrl;
      } else {
        console.warn(`[getRuneStyleImageUrl] Style ${styleId} found but has no icon property:`, style);
      }
    } else {
      console.warn(`[getRuneStyleImageUrl] Style ${styleId} not found in rune tree. Available styles:`, runeDataCache.runeTree.map(s => s.id));
    }
  } else {
    console.warn(`[getRuneStyleImageUrl] Rune tree is empty for style ID: ${styleId}`);
  }
  
  // Fallback: use direct CDN path
  const styleMap: Record<number, string> = {
    8000: 'perk-images/Styles/7201_Precision/7201_Precision.png',
    8100: 'perk-images/Styles/7200_Domination/7200_Domination.png',
    8200: 'perk-images/Styles/7202_Sorcery/7202_Sorcery.png',
    8300: 'perk-images/Styles/7204_Inspiration/7204_Inspiration.png',
    8400: 'perk-images/Styles/7203_Whimsy/7203_Whimsy.png',
  };
  
  const stylePath = styleMap[styleId] || 'perk-images/Styles/7200_Domination/7200_Domination.png';
  const version = runeDataCache.version || (typeof window !== 'undefined' && (window as any).__DD_VERSION__) || '14.1.1';
  const fallbackUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/${stylePath}`;
  console.log(`[getRuneStyleImageUrl] Using fallback for style ${styleId}: ${fallbackUrl}`);
  return fallbackUrl;
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
