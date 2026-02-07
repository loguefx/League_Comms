'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/utils/api';
import Link from 'next/link';

interface PlayerStats {
  puuid: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  last20Wins: number;
  last20Losses: number;
  last20WinRate: number;
  mainRole: string | null;
  topChampions: Array<{
    championId: number;
    games: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
}

interface RiotAccount {
  gameName: string;
  tagLine: string;
  region?: string;
  connected: boolean;
}

interface Match {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  gameType: string;
  participants: Array<{
    puuid: string;
    championId: number;
    teamId: number;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    totalMinionsKilled: number;
    individualPosition: string;
    role: string;
  }>;
  teams: Array<{
    teamId: number;
    win: boolean;
  }>;
}

export default function ProfilePage() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleStats, setRoleStats] = useState<Record<string, { played: number; wins: number; losses: number }>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = getApiUrl();

      // Load account info
      const accountRes = await fetch(`${apiUrl}/auth/riot/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (accountRes.ok) {
        const accountData = await accountRes.json();
        setAccount(accountData);
      }

      // Load player stats first
      const statsRes = await fetch(`${apiUrl}/stats/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let statsData: PlayerStats | null = null;
      if (statsRes.ok) {
        statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load recent matches
      const matchesRes = await fetch(`${apiUrl}/stats/match-history?count=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setRecentMatches(matchesData.slice(0, 10));
        
        // Calculate role stats using the loaded stats puuid
        if (statsData) {
          const roleCounts: Record<string, { played: number; wins: number; losses: number }> = {};
          matchesData.forEach((match: Match) => {
            const participant = match.participants?.find((p: any) => p.puuid === statsData!.puuid);
            if (participant) {
              const role = participant.individualPosition || participant.role || 'UNKNOWN';
              const normalizedRole = normalizeRole(role);
              if (!roleCounts[normalizedRole]) {
                roleCounts[normalizedRole] = { played: 0, wins: 0, losses: 0 };
              }
              roleCounts[normalizedRole].played++;
              if (participant.win) {
                roleCounts[normalizedRole].wins++;
              } else {
                roleCounts[normalizedRole].losses++;
              }
            }
          });
          setRoleStats(roleCounts);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeRole = (role: string): string => {
    const upper = role.toUpperCase();
    if (upper.includes('TOP')) return 'TOP';
    if (upper.includes('JUNGLE')) return 'JUNGLE';
    if (upper.includes('MID')) return 'MID';
    if (upper.includes('BOTTOM') || upper.includes('ADC')) return 'ADC';
    if (upper.includes('UTILITY') || upper.includes('SUPPORT')) return 'SUPPORT';
    return 'UNKNOWN';
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[#B4BEC8]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!account?.connected) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="text-center bg-[#161C2A] border border-[#283D4D] rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Riot Account</h2>
          <p className="text-[#B4BEC8] mb-6">Link your Riot Games account to view your profile and stats.</p>
          <Link
            href="/settings"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D121E]">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Player Header */}
        <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {account.gameName}#{account.tagLine}
                {account.region && <span className="text-[#78828C] text-lg ml-2">({account.region.toUpperCase()})</span>}
              </h1>
              {stats && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[#B4BEC8]">Level {stats.totalGames > 0 ? Math.floor(stats.totalGames / 10) : 1}</span>
                  {stats.mainRole && (
                    <span className="text-[#78828C]">Main Role: <span className="text-white">{stats.mainRole}</span></span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Ratings & Recent Games */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Ratings */}
            {stats && (
              <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Personal Ratings</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#B4BEC8]">Soloqueue</span>
                      <span className="text-[#78828C] text-sm">Overall</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-white">
                        {stats.wins}W - {stats.losses}L ({stats.winRate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-[#78828C]">
                      Total Games: {stats.totalGames}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#283D4D]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#B4BEC8]">Last 20 Games</span>
                    </div>
                    <div className="text-xl font-semibold text-white">
                      {stats.last20Wins}W - {stats.last20Losses}L ({stats.last20WinRate.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Games */}
            <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Games</h2>
                <Link href="/match-history" className="text-blue-400 hover:text-blue-300 text-sm">
                  View All →
                </Link>
              </div>
              {recentMatches.length === 0 ? (
                <div className="text-center py-8 text-[#B4BEC8]">
                  <p>No recent games found</p>
                  <p className="text-sm text-[#78828C] mt-2">Play some games to see your match history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMatches.map((match) => {
                    const participant = match.participants?.find((p: any) => p.puuid === stats?.puuid);
                    if (!participant) return null;
                    const won = participant.win;
                    const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
                    const kdaRatio = participant.deaths > 0 
                      ? ((participant.kills + participant.assists) / participant.deaths).toFixed(2)
                      : (participant.kills + participant.assists).toFixed(2);
                    
                    return (
                      <Link
                        key={match.matchId}
                        href={`/match-history?match=${match.matchId}`}
                        className="block bg-[#0D121E] border border-[#283D4D] rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold text-lg ${
                              won ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {won ? 'W' : 'L'}
                            </div>
                            <div>
                              <div className="text-white font-medium">{formatTimeAgo(match.gameCreation)}</div>
                              <div className="text-[#78828C] text-sm">{formatDuration(match.gameDuration)}</div>
                              <div className="text-[#B4BEC8] text-sm mt-1">
                                {kda} KDA ({kdaRatio})
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#B4BEC8] text-sm">{participant.totalMinionsKilled} CS</div>
                            <div className="text-[#78828C] text-xs mt-1">
                              {normalizeRole(participant.individualPosition || participant.role)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Role & Champion Stats */}
          <div className="space-y-6">
            {/* Role Statistics */}
            <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Role Statistics</h2>
              <div className="space-y-3">
                {Object.entries(roleStats)
                  .sort((a, b) => b[1].played - a[1].played)
                  .map(([role, stats]) => {
                    const winRate = stats.played > 0 ? (stats.wins / stats.played) * 100 : 0;
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">{role}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[#B4BEC8] text-sm">Played: {stats.played}</div>
                          <div className={`text-sm font-semibold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            Winrate: {winRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(roleStats).length === 0 && (
                  <div className="text-[#78828C] text-sm text-center py-4">No role data available</div>
                )}
              </div>
            </div>

            {/* Champion Statistics */}
            {stats && stats.topChampions.length > 0 && (
              <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Champion Statistics</h2>
                <div className="space-y-3">
                  {stats.topChampions.map((champ) => (
                    <div key={champ.championId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#283D4D] rounded-lg flex items-center justify-center">
                          <span className="text-xs text-[#78828C]">{champ.championId}</span>
                        </div>
                        <span className="text-white font-medium">Champion {champ.championId}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[#B4BEC8] text-sm">Played: {champ.games}</div>
                        <div className={`text-sm font-semibold ${champ.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {champ.winRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
