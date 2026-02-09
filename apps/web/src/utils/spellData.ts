// Summoner spell data utilities for fetching and displaying spell names and descriptions from Data Dragon

interface SpellData {
  id: string;
  name: string;
  description: string;
  cooldown: number[];
}

let spellDataCache: Map<number, SpellData> | null = null;
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
    console.error('Failed to fetch Data Dragon version:', error);
    return '14.1.1';
  }
}

/**
 * Fetch and cache spell data from Data Dragon
 */
async function fetchSpellData(): Promise<void> {
  if (spellDataCache) return;

  try {
    const version = await getLatestVersion();
    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spell data: ${response.status}`);
    }

    const data: { data: Record<string, SpellData & { key: string }> } = await response.json();
    
    spellDataCache = new Map();
    Object.values(data.data).forEach((spell) => {
      const spellId = parseInt(spell.key, 10);
      if (!isNaN(spellId)) {
        spellDataCache!.set(spellId, {
          id: spell.id,
          name: spell.name,
          description: spell.description,
          cooldown: spell.cooldown,
        });
      }
    });
    
    console.log(`[fetchSpellData] Loaded ${spellDataCache.size} spells from Data Dragon version ${version}`);
  } catch (error) {
    console.error('Failed to fetch spell data:', error);
    spellDataCache = new Map();
  }
}

/**
 * Preload spell data (call this early in the app lifecycle)
 */
export async function preloadSpellData(): Promise<void> {
  await fetchSpellData();
}

/**
 * Get spell name by spell ID
 */
export async function getSpellName(spellId: number): Promise<string> {
  await fetchSpellData();
  return spellDataCache?.get(spellId)?.name || `Spell ${spellId}`;
}

/**
 * Get spell description by spell ID
 */
export async function getSpellDescription(spellId: number): Promise<string> {
  await fetchSpellData();
  const spell = spellDataCache?.get(spellId);
  if (!spell) return `No description available for spell ${spellId}`;
  
  // Strip HTML tags and limit length for tooltip
  return spell.description.replace(/<[^>]*>/g, '').substring(0, 200);
}

/**
 * Get spell data (name and description) by spell ID
 */
export async function getSpellData(spellId: number): Promise<{ name: string; description: string }> {
  await fetchSpellData();
  const spell = spellDataCache?.get(spellId);
  if (!spell) {
    return {
      name: `Spell ${spellId}`,
      description: `No description available for spell ${spellId}`,
    };
  }
  
  return {
    name: spell.name,
    description: spell.description.replace(/<[^>]*>/g, '').substring(0, 200),
  };
}
