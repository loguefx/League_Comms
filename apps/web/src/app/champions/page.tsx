'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/utils/api';
import {
  preloadChampionData,
  getChampionNameSync,
  getChampionImageUrl,
  calculateTier,
} from '@/utils/championData';

interface ChampionStats {
  championId: number;
  games: number;
  wins: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  counterPicks?: number[];
  role?: string;
}

// Enhanced tier styling with gradients
function getTierStyles(tier: string) {
  const styles = {
    'S+': {
      gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
      bg: 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10',
      border: 'border-yellow-500/40',
      text: 'text-yellow-300',
      glow: 'shadow-yellow-500/20',
    },
    'S': {
      gradient: 'from-yellow-500 via-yellow-600 to-orange-500',
      bg: 'bg-gradient-to-br from-yellow-600/20 to-orange-500/10',
      border: 'border-yellow-600/40',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-600/20',
    },
    'A': {
      gradient: 'from-emerald-400 via-green-500 to-teal-500',
      bg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      glow: 'shadow-emerald-500/20',
    },
    'B': {
      gradient: 'from-blue-400 via-cyan-500 to-blue-600',
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-500/40',
      text: 'text-blue-300',
      glow: 'shadow-blue-500/20',
    },
    'C': {
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      bg: 'bg-gradient-to-br from-purple-500/20 to-violet-500/10',
      border: 'border-purple-500/40',
      text: 'text-purple-300',
      glow: 'shadow-purple-500/20',
    },
    'D': {
      gradient: 'from-gray-500 via-slate-500 to-gray-600',
      bg: 'bg-gradient-to-br from-gray-500/20 to-slate-500/10',
      border: 'border-gray-500/40',
      text: 'text-gray-400',
      glow: 'shadow-gray-500/20',
    },
  };
  return styles[tier as keyof typeof styles] || styles.D;
}

export default function ChampionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [champions, setChampions] = useState<ChampionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [championDataLoaded, setChampionDataLoaded] = useState(false);
  const [availablePatches, setAvailablePatches] = useState<string[]>([]);
  const [latestPatch, setLatestPatch] = useState<string | null>(null);
  const [patchesLoading, setPatchesLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    rank: searchParams.get('rank') || 'PLATINUM_PLUS',
    role: searchParams.get('role') || '',
    patch: searchParams.get('patch') || 'latest',
    region: searchParams.get('region') || 'world',
  });
  
  useEffect(() => {
    const urlRank = searchParams.get('rank');
    const urlRole = searchParams.get('role');
    const urlPatch = searchParams.get('patch');
    const urlRegion = searchParams.get('region');
    
    if (urlRank || urlRole !== null || urlPatch || urlRegion) {
      setFilters({
        rank: urlRank || 'PLATINUM_PLUS',
        role: urlRole || '',
        patch: urlPatch || 'latest',
        region: urlRegion || 'world',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    preloadChampionData().then(() => {
      setChampionDataLoaded(true);
    });
    
    const fetchPatches = async () => {
      setPatchesLoading(true);
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/champions/patches`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const patches = Array.isArray(data.patches) ? data.patches : [];
        
        if (patches.length > 0) {
          setAvailablePatches(patches);
          const latest = data.latest || patches[0];
          setLatestPatch(latest);
          setFilters(prev => prev.patch === 'latest' || !prev.patch ? { ...prev, patch: latest } : prev);
        } else {
          setAvailablePatches([]);
          setLatestPatch(null);
        }
      } catch (error) {
        console.error('[ChampionsPage] Failed to fetch patches:', error);
        setAvailablePatches([]);
        setLatestPatch(null);
      } finally {
        setPatchesLoading(false);
      }
    };
    fetchPatches();
  }, []);

  useEffect(() => {
    if (championDataLoaded) {
      loadChampions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, championDataLoaded]);

  const loadChampions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.rank) params.append('rank', filters.rank);
      if (filters.role) params.append('role', filters.role);
      if (filters.patch) params.append('patch', filters.patch);
      if (filters.region) params.append('region', filters.region);

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/champions?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setChampions(data.champions || []);
    } catch (error: any) {
      console.error('Error loading champions:', error);
      setChampions([]);
    } finally {
      setLoading(false);
    }
  };

  const renderChampionCard = (champ: ChampionStats, index: number) => {
    const tier = calculateTier(champ.winRate, champ.pickRate, champ.games);
    const tierStyles = getTierStyles(tier);
    const championName = getChampionNameSync(champ.championId);
    const championImageUrl = getChampionImageUrl(champ.championId);

    return (
      <div
        key={`${champ.championId}-${champ.role || 'all'}`}
        onClick={() => {
          const params = new URLSearchParams({
            rank: filters.rank,
            role: filters.role || 'ALL',
            patch: filters.patch,
            region: filters.region,
          });
          router.push(`/champions/${champ.championId}?${params}`);
        }}
        className="group relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-[#334155]/50 rounded-xl p-4 hover:border-[#475569] hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      >
        {/* Rank Badge */}
        <div className="absolute top-3 right-3 text-xs font-bold text-[#64748B] opacity-60">
          #{index + 1}
        </div>

        <div className="flex items-start gap-4">
          {/* Champion Image */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-lg overflow-hidden ring-2 ring-[#1E293B] group-hover:ring-[#334155] transition-all">
              <img
                src={championImageUrl}
                alt={championName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Unknown.png`;
                }}
              />
            </div>
            {/* Tier Badge Overlay */}
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${tierStyles.bg} border-2 ${tierStyles.border} flex items-center justify-center shadow-lg ${tierStyles.glow}`}>
              <span className={`text-xs font-bold ${tierStyles.text}`}>{tier}</span>
            </div>
          </div>

          {/* Champion Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                {championName}
              </h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-xs text-[#94A3B8] mb-1">Win Rate</div>
                <div className={`text-sm font-bold ${champ.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {champ.winRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#94A3B8] mb-1">Pick Rate</div>
                <div className="text-sm font-semibold text-[#CBD5E1]">
                  {champ.pickRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#94A3B8] mb-1">Ban Rate</div>
                <div className="text-sm font-semibold text-[#CBD5E1]">
                  {champ.banRate?.toFixed(1) || '0.0'}%
                </div>
              </div>
            </div>

            {/* Counter Picks */}
            {champ.counterPicks && champ.counterPicks.length > 0 ? (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#64748B] font-medium">Counters:</span>
                  <div className="flex -space-x-2">
                    {champ.counterPicks.slice(0, 5).map((counterChampId) => {
                      const counterName = getChampionNameSync(counterChampId);
                      const counterImageUrl = getChampionImageUrl(counterChampId);
                      return (
                        <div
                          key={counterChampId}
                          className="relative group/counter"
                          title={counterName}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#1E293B] hover:ring-[#334155] transition-all hover:scale-110 z-10">
                            <img
                              src={counterImageUrl}
                              alt={counterName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Unknown.png`;
                              }}
                            />
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover/counter:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            {counterName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Matches Count - More Visible */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1E293B]/50 border border-[#334155]/50 rounded-md">
                  <span className="text-xs text-[#94A3B8] font-medium">Matches:</span>
                  <span className="text-sm font-bold text-white">{champ.games?.toLocaleString() || 0}</span>
                </div>
              </div>
            ) : (
              <div className="mb-2">
                <div className="text-xs text-[#475569] italic mb-2">No counter data</div>
                {/* Matches Count - More Visible */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1E293B]/50 border border-[#334155]/50 rounded-md">
                  <span className="text-xs text-[#94A3B8] font-medium">Matches:</span>
                  <span className="text-sm font-bold text-white">{champ.games?.toLocaleString() || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Champion Analytics
          </h1>
          <p className="text-[#94A3B8] text-sm">Real-time performance data and tier rankings</p>
        </div>

        {/* Filters */}
        <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl shadow-2xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#CBD5E1]">Rank Tier</label>
              <select
                value={filters.rank}
                onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="CHALLENGER">Challenger</option>
                <option value="GRANDMASTER_PLUS">Grandmaster+</option>
                <option value="MASTER_PLUS">Master+</option>
                <option value="DIAMOND_PLUS">Diamond+</option>
                <option value="EMERALD_PLUS">Emerald+</option>
                <option value="PLATINUM_PLUS">Platinum+</option>
                <option value="GOLD_PLUS">Gold+</option>
                <option value="SILVER_PLUS">Silver+</option>
                <option value="BRONZE_PLUS">Bronze+</option>
                <option value="IRON_PLUS">Iron+</option>
                <option value="ALL_RANKS">All Ranks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-[#CBD5E1]">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="">All Roles</option>
                <option value="TOP">Top Lane</option>
                <option value="JUNGLE">Jungle</option>
                <option value="MID">Mid Lane</option>
                <option value="ADC">ADC / Bot Lane</option>
                <option value="SUPPORT">Support</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-[#CBD5E1]">Patch</label>
              <select
                value={filters.patch}
                onChange={(e) => setFilters({ ...filters, patch: e.target.value })}
                className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                {patchesLoading ? (
                  <option value="latest">Loading patches...</option>
                ) : availablePatches.length > 0 ? (
                  availablePatches.map((patch) => (
                    <option key={patch} value={patch}>
                      {patch}{patch === latestPatch ? ' (Latest)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="latest">No patches available</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-[#CBD5E1]">Region</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="world">World (All Regions)</option>
                <option value="na1">North America</option>
                <option value="euw1">Europe West</option>
                <option value="eun1">Europe Nordic & East</option>
                <option value="kr">Korea</option>
                <option value="br1">Brazil</option>
                <option value="la1">Latin America North</option>
                <option value="la2">Latin America South</option>
                <option value="oc1">Oceania</option>
                <option value="ru">Russia</option>
                <option value="tr1">Turkey</option>
                <option value="jp1">Japan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Champion Grid */}
        <div>
          {loading ? (
            <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-[#94A3B8]">Loading champion data...</p>
            </div>
          ) : champions.length === 0 ? (
            <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-12 text-center text-[#94A3B8]">
              No champion data available. Seed the database to populate champion statistics.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {champions.map((champ, index) => renderChampionCard(champ, index))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
