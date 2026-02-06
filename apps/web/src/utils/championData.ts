// Champion ID to name mapping (simplified - in production, use Data Dragon)
export const CHAMPION_NAMES: Record<number, string> = {
  1: 'Annie',
  2: 'Olaf',
  3: 'Galio',
  4: 'Twisted Fate',
  5: 'Xin Zhao',
  // Add more as needed - in production, fetch from Data Dragon API
};

export function getChampionName(championId: number): string {
  return CHAMPION_NAMES[championId] || `Champion ${championId}`;
}

export function getChampionImageUrl(championId: number): string {
  // In production, use Data Dragon CDN
  // For now, return placeholder
  return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${getChampionName(championId)}.png`;
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
