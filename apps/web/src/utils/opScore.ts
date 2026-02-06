// OP Score calculation (simplified version)
// Based on KDA, damage, CS, wards, etc.

export function calculateOPScore(player: {
  kills: number;
  deaths: number;
  assists: number;
  damageDealtToChampions: number;
  totalMinionsKilled: number;
  wardsPlaced: number;
  wardsKilled: number;
  gameDuration: number;
}): number {
  const kda = player.deaths > 0 
    ? (player.kills + player.assists) / player.deaths 
    : player.kills + player.assists;
  
  const csPerMin = (player.totalMinionsKilled / (player.gameDuration / 60));
  const damagePerMin = player.damageDealtToChampions / (player.gameDuration / 60);
  
  // Simplified OP Score formula
  const score = 
    (kda * 2) +
    (csPerMin * 0.1) +
    (damagePerMin * 0.01) +
    (player.wardsPlaced * 0.1) +
    (player.wardsKilled * 0.2);
  
  return Math.round(score * 10) / 10;
}

export function getOPScoreRank(score: number, allScores: number[]): string {
  const sorted = [...allScores].sort((a, b) => b - a);
  const rank = sorted.indexOf(score) + 1;
  
  if (rank === 1) return 'MVP';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  if (rank <= 5) return `${rank}th`;
  if (rank <= 7) return `${rank}th`;
  if (rank <= 9) return `${rank}th`;
  return `${rank}th`;
}
