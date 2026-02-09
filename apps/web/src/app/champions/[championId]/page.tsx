'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/utils/api';
import { getChampionNameSync, getChampionImageUrl, preloadChampionData } from '@/utils/championData';

interface BuildArchetype {
  archetype: string;
  runes: {
    primaryStyleId: number;
    subStyleId: number;
    perkIds: number[];
    statShards: number[];
    winRate: number;
    games: number;
  };
  spells: {
    spell1Id: number;
    spell2Id: number;
    winRate: number;
    games: number;
  } | null;
  items: {
    items: number[];
    winRate: number;
    games: number;
  };
  totalGames: number;
  overallWinRate: number;
}

interface ChampionBuild {
  championId: number;
  patch: string;
  rank: string;
  role: string;
  region: string;
  tierStats: {
    championId: number;
    games: number;
    wins: number;
    winRate: number;
    pickRate: number;
    banRate: number;
  } | null;
  builds: BuildArchetype[];
}

// Get spell image URL
function getSpellImageUrl(spellId: number): string {
  const spellMap: Record<number, string> = {
    1: 'Cleanse', 3: 'Exhaust', 4: 'Flash', 6: 'Ghost',
    7: 'Heal', 11: 'Smite', 12: 'Teleport', 13: 'Clarity',
    14: 'Ignite', 21: 'Barrier',
  };
  const spellName = spellMap[spellId] || 'SummonerSpell';
  return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${spellName}.png`;
}

// Get item image URL
function getItemImageUrl(itemId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemId}.png`;
}

// Get rune style image URL
function getRuneStyleImageUrl(styleId: number): string {
  const styleMap: Record<number, string> = {
    8000: '7201_Precision', 8100: '7200_Domination',
    8200: '7202_Sorcery', 8300: '7204_Inspiration',
    8400: '7203_Whimsy',
  };
  const styleName = styleMap[styleId] || '7200_Domination';
  return `https://ddragon.leagueoflegends.com/cdn/img/${styleName}.png`;
}

export default function ChampionBuildPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const championId = parseInt(params.championId as string, 10);

  const [build, setBuild] = useState<ChampionBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [championDataLoaded, setChampionDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildIndex, setSelectedBuildIndex] = useState(0);

  const rank = searchParams.get('rank') || 'ALL_RANKS';
  const role = searchParams.get('role') || 'ALL';
  const patch = searchParams.get('patch') || 'latest';
  const region = searchParams.get('region') || 'world';

  useEffect(() => {
    preloadChampionData().then(() => {
      setChampionDataLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!championDataLoaded || isNaN(championId)) {
      return;
    }

    const loadBuild = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = getApiUrl();
        const params = new URLSearchParams({
          rank,
          role,
          patch,
          ...(region !== 'world' && { region }),
        });

        const response = await fetch(`${apiUrl}/champions/${championId}/build?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setBuild(data);
        if (data.builds && data.builds.length > 0) {
          setSelectedBuildIndex(0);
        }
      } catch (err: any) {
        console.error('Error loading champion build:', err);
        setError(err.message || 'Failed to load champion build');
      } finally {
        setLoading(false);
      }
    };

    loadBuild();
  }, [championId, rank, role, patch, region, championDataLoaded]);

  if (loading || !championDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-[#94A3B8]">Loading champion build...</p>
        </div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-[#94A3B8] mb-6">{error || 'Champion build not found'}</p>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                rank,
                role: role || 'ALL',
                patch,
                ...(region !== 'world' && { region }),
              });
              router.push(`/champions?${params.toString()}`);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-semibold"
          >
            Back to Champions
          </button>
        </div>
      </div>
    );
  }

  const championName = getChampionNameSync(championId);
  const championImageUrl = getChampionImageUrl(championId);
  const selectedBuild = build.builds[selectedBuildIndex];

  if (!selectedBuild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {championName}
          </h1>
          <p className="text-[#94A3B8] mb-6">
            No build data available for this champion yet. Build data is computed from match statistics.
            <br />
            <span className="text-sm text-[#64748B]">Try selecting different filters or wait for more matches to be processed.</span>
          </p>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                rank,
                role: role || 'ALL',
                patch,
                ...(region !== 'world' && { region }),
              });
              router.push(`/champions?${params.toString()}`);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-semibold"
          >
            Back to Champions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F172A] to-[#0A0E1A]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              const params = new URLSearchParams({
                rank,
                role: role || 'ALL',
                patch,
                ...(region !== 'world' && { region }),
              });
              router.push(`/champions?${params.toString()}`);
            }}
            className="mb-6 text-[#94A3B8] hover:text-white transition-colors flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Champions</span>
          </button>

          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-[#1E293B] shadow-xl">
                <img
                  src={championImageUrl}
                  alt={championName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {championName}
              </h1>
              <p className="text-[#94A3B8] text-sm mb-4">
                {build.role} • {build.rank.replace('_', ' ')} • Patch {build.patch} • {build.region === 'world' ? 'World' : build.region.toUpperCase()}
              </p>
              {build.tierStats && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                    <span className="text-[#94A3B8]">Win Rate: </span>
                    <span className="text-emerald-400 font-bold">{build.tierStats.winRate.toFixed(2)}%</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg">
                    <span className="text-[#94A3B8]">Pick Rate: </span>
                    <span className="text-blue-400 font-bold">{build.tierStats.pickRate.toFixed(2)}%</span>
                  </div>
                  <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg">
                    <span className="text-[#94A3B8]">Ban Rate: </span>
                    <span className="text-red-400 font-bold">{build.tierStats.banRate.toFixed(2)}%</span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg">
                    <span className="text-[#94A3B8]">Matches: </span>
                    <span className="text-white font-bold">{build.tierStats.games.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Build Archetype Tabs */}
        {build.builds.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2 border-b border-[#1E293B] pb-4">
            {build.builds.map((buildArchetype, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedBuildIndex(idx)}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                  selectedBuildIndex === idx
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#334155]'
                }`}
              >
                {buildArchetype.archetype}
              </button>
            ))}
          </div>
        )}

        {/* Build Display */}
        <div className="space-y-6">
          {/* Runes Section */}
          <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Rune Setup</h2>
              <div className="text-sm text-[#94A3B8]">
                <span className="text-emerald-400 font-semibold">{selectedBuild.runes.winRate.toFixed(1)}%</span> win rate •{' '}
                <span className="text-white">{selectedBuild.runes.games.toLocaleString()}</span> games
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Runes */}
              <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-[#334155]">
                <div className="text-xs text-[#64748B] mb-3 font-semibold uppercase tracking-wider">Primary</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] border border-[#334155] flex items-center justify-center">
                    <span className="text-xs text-[#94A3B8]">Style {selectedBuild.runes.primaryStyleId}</span>
                  </div>
                  <div className="flex gap-2">
                    {selectedBuild.runes.perkIds.slice(0, 4).map((perkId, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-lg bg-[#0F172A] border-2 border-[#334155] hover:border-blue-500/50 transition-colors flex items-center justify-center group relative"
                        title={`Perk ${perkId}`}
                      >
                        <span className="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors">{perkId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secondary Runes */}
              <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-[#334155]">
                <div className="text-xs text-[#64748B] mb-3 font-semibold uppercase tracking-wider">Secondary</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] border border-[#334155] flex items-center justify-center">
                    <span className="text-xs text-[#94A3B8]">Style {selectedBuild.runes.subStyleId}</span>
                  </div>
                  <div className="flex gap-2">
                    {selectedBuild.runes.perkIds.slice(4, 6).map((perkId, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-lg bg-[#0F172A] border-2 border-[#334155] hover:border-purple-500/50 transition-colors flex items-center justify-center group relative"
                        title={`Perk ${perkId}`}
                      >
                        <span className="text-xs text-[#94A3B8] group-hover:text-purple-400 transition-colors">{perkId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Shards */}
            <div className="mt-4 pt-4 border-t border-[#334155]">
              <div className="text-xs text-[#64748B] mb-3 font-semibold uppercase tracking-wider">Stat Shards</div>
              <div className="flex gap-3">
                {selectedBuild.runes.statShards.map((shardId, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-cyan-500/50 transition-colors flex items-center justify-center group"
                    title={`Shard ${shardId}`}
                  >
                    <span className="text-xs text-[#94A3B8] group-hover:text-cyan-400 transition-colors">{shardId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Spells & Items Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summoner Spells */}
            {selectedBuild.spells && (
              <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Summoner Spells</h2>
                  <div className="text-sm text-[#94A3B8]">
                    <span className="text-emerald-400 font-semibold">{selectedBuild.spells.winRate.toFixed(1)}%</span> win rate •{' '}
                    <span className="text-white">{selectedBuild.spells.games.toLocaleString()}</span> games
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#1E293B] border-2 border-[#334155] hover:border-blue-500/50 transition-all hover:scale-110 flex items-center justify-center group relative">
                    <span className="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors font-semibold">
                      {selectedBuild.spells.spell1Id}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Spell {selectedBuild.spells.spell1Id}
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-[#1E293B] border-2 border-[#334155] hover:border-blue-500/50 transition-all hover:scale-110 flex items-center justify-center group relative">
                    <span className="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors font-semibold">
                      {selectedBuild.spells.spell2Id}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Spell {selectedBuild.spells.spell2Id}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Core Items */}
            <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Core Items</h2>
                <div className="text-sm text-[#94A3B8]">
                  <span className="text-emerald-400 font-semibold">{selectedBuild.items.winRate.toFixed(1)}%</span> win rate •{' '}
                  <span className="text-white">{selectedBuild.items.games.toLocaleString()}</span> games
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedBuild.items.items.map((itemId, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 rounded-xl bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative"
                    title={`Item ${itemId}`}
                  >
                    <span className="text-xs text-[#94A3B8] group-hover:text-amber-400 transition-colors font-semibold">
                      {itemId}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Item {itemId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
