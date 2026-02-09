/**
 * Rank Bracket Utilities
 * 
 * Handles conversion between Riot API tiers and U.GG-style rank brackets.
 * 
 * U.GG Rank Brackets:
 * - overall (all ranks combined)
 * - iron, bronze, silver, gold, platinum, emerald, diamond (individual tiers)
 * - emerald_plus, diamond_plus (combined brackets)
 * - master_plus (Master, Grandmaster, Challenger combined)
 */

export type RankBracket =
  | 'overall'
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'emerald'
  | 'diamond'
  | 'emerald_plus'
  | 'diamond_plus'
  | 'master_plus';

/**
 * Convert Riot API tier to U.GG rank bracket format
 * @param tier - Riot API tier (e.g., "EMERALD", "MASTER", "CHALLENGER")
 * @returns U.GG rank bracket (e.g., "emerald", "master_plus")
 */
export function tierToRankBracket(tier: string): RankBracket {
  const normalized = tier.toUpperCase().trim();
  
  // Master+ tiers (Master, Grandmaster, Challenger) -> "master_plus"
  if (normalized === 'MASTER' || normalized === 'GRANDMASTER' || normalized === 'CHALLENGER') {
    return 'master_plus';
  }
  
  // Regular tiers -> lowercase
  const bracket = normalized.toLowerCase();
  
  // Validate it's a known bracket
  const validBrackets: RankBracket[] = [
    'iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'
  ];
  
  if (validBrackets.includes(bracket as RankBracket)) {
    return bracket as RankBracket;
  }
  
  // Fallback: return as-is (might be a combined bracket already)
  return bracket as RankBracket;
}

/**
 * Check if a rank bracket is a combined bracket (e.g., emerald_plus, diamond_plus, master_plus)
 */
export function isCombinedBracket(bracket: string): boolean {
  return bracket === 'emerald_plus' || bracket === 'diamond_plus' || bracket === 'master_plus' || bracket === 'overall';
}

/**
 * Expand a combined bracket to individual brackets for querying
 * @param bracket - Combined bracket (e.g., "emerald_plus", "diamond_plus", "master_plus", "overall")
 * @returns Array of individual brackets
 */
export function expandCombinedBracket(bracket: string): string[] {
  switch (bracket) {
    case 'emerald_plus':
      return ['emerald', 'diamond', 'master_plus'];
    case 'diamond_plus':
      return ['diamond', 'master_plus'];
    case 'master_plus':
      return ['master_plus']; // Already expanded
    case 'overall':
      return ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master_plus'];
    default:
      return [bracket]; // Individual bracket, return as-is
  }
}

/**
 * Normalize frontend rank filter to database rank bracket
 * Handles various formats: "IRON_PLUS", "IRON", "ALL_RANKS", etc.
 */
export function normalizeRankBracket(rank: string | undefined | null): RankBracket | 'all_ranks' {
  if (!rank || rank === 'ALL_RANKS' || rank === 'all_ranks') {
    return 'all_ranks'; // Special case for querying all ranks
  }
  
  const normalized = rank.toLowerCase().trim();
  
  // Remove _plus suffix if present (iron_plus -> iron)
  const baseRank = normalized.replace(/_plus$/, '');
  
  // Map to database values
  const rankMap: Record<string, RankBracket> = {
    'iron': 'iron',
    'bronze': 'bronze',
    'silver': 'silver',
    'gold': 'gold',
    'platinum': 'platinum',
    'emerald': 'emerald',
    'diamond': 'diamond',
    // Master+ variants all map to master_plus
    'master': 'master_plus',
    'grandmaster': 'master_plus',
    'challenger': 'master_plus',
  };
  
  // Check if base rank exists in map
  if (rankMap[baseRank]) {
    return rankMap[baseRank];
  }
  
  // Check if it's a combined bracket
  if (normalized === 'emerald_plus' || normalized === 'diamond_plus' || normalized === 'master_plus' || normalized === 'overall') {
    return normalized as RankBracket;
  }
  
  // Fallback: return normalized (shouldn't happen with valid inputs)
  return normalized as RankBracket;
}
