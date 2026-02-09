'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/utils/api';
import { getChampionNameSync, getChampionImageUrl, preloadChampionData } from '@/utils/championData';

interface BuildArchetype {
  archetype: string; // "Recommended", "Tank", "AP", "Lethality", etc.
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

  // Get filters from URL or use defaults
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
        // Reset to first build if available
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
      <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-[#B4BEC8]">Loading champion build...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
            <p className="text-[#B4BEC8]">{error || 'Champion build not found'}</p>
            <button
              onClick={() => router.push('/champions')}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Back to Champions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const championName = getChampionNameSync(championId);
  const championImageUrl = getChampionImageUrl(championId);
  const selectedBuild = build.builds[selectedBuildIndex];

  if (!selectedBuild) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">{championName}</h1>
            <p className="text-[#B4BEC8]">
              No build data available for this champion yet. Build data is computed from match statistics.
              <br />
              Try selecting different filters or wait for more matches to be processed.
            </p>
            <button
              onClick={() => router.push('/champions')}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Back to Champions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/champions')}
            className="mb-4 text-[#B4BEC8] hover:text-white transition-colors"
          >
            ← Back to Champions
          </button>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-lg overflow-hidden">
              <img
                src={championImageUrl}
                alt={championName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{championName}</h1>
              <p className="text-[#B4BEC8]">
                {build.role} • {build.rank} • Patch {build.patch} • {build.region === 'world' ? 'World' : build.region.toUpperCase()}
              </p>
              {build.tierStats && (
                <div className="mt-2 flex gap-4 text-sm">
                  <span>Win Rate: <span className="text-green-400">{build.tierStats.winRate.toFixed(2)}%</span></span>
                  <span>Pick Rate: <span className="text-blue-400">{build.tierStats.pickRate.toFixed(2)}%</span></span>
                  <span>Ban Rate: <span className="text-red-400">{build.tierStats.banRate.toFixed(2)}%</span></span>
                  <span>Matches: <span className="text-[#B4BEC8]">{build.tierStats.games.toLocaleString()}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Build Archetype Tabs (like U.GG) */}
        {build.builds.length > 1 && (
          <div className="mb-6 flex gap-2 border-b border-[#283D4D]">
            {build.builds.map((buildArchetype, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedBuildIndex(idx)}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                  selectedBuildIndex === idx
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-[#B4BEC8] hover:text-white'
                }`}
              >
                {buildArchetype.archetype}
              </button>
            ))}
          </div>
        )}

        {/* Selected Build Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Runes */}
          <div className="bg-[#0D121E] border border-[#283D4D] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Runes</h2>
            <div className="mb-4">
              <p className="text-sm text-[#B4BEC8]">
                {selectedBuild.runes.winRate.toFixed(2)}% Win Rate • {selectedBuild.runes.games.toLocaleString()} Matches
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#B4BEC8] mb-2">Primary: Style {selectedBuild.runes.primaryStyleId}</p>
                <div className="flex gap-2">
                  {selectedBuild.runes.perkIds.slice(0, 4).map((perkId, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 bg-[#283D4D] rounded border border-[#3A4A5C] flex items-center justify-center"
                      title={`Perk ${perkId}`}
                    >
                      <span className="text-xs text-[#B4BEC8]">{perkId}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#B4BEC8] mb-2">Secondary: Style {selectedBuild.runes.subStyleId}</p>
                <div className="flex gap-2">
                  {selectedBuild.runes.perkIds.slice(4, 6).map((perkId, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 bg-[#283D4D] rounded border border-[#3A4A5C] flex items-center justify-center"
                      title={`Perk ${perkId}`}
                    >
                      <span className="text-xs text-[#B4BEC8]">{perkId}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#B4BEC8] mb-2">Stat Shards</p>
                <div className="flex gap-2">
                  {selectedBuild.runes.statShards.map((shardId, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 bg-[#283D4D] rounded border border-[#3A4A5C] flex items-center justify-center"
                      title={`Shard ${shardId}`}
                    >
                      <span className="text-xs text-[#B4BEC8]">{shardId}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summoner Spells */}
          {selectedBuild.spells && (
            <div className="bg-[#0D121E] border border-[#283D4D] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Summoner Spells</h2>
              <div className="mb-4">
                <p className="text-sm text-[#B4BEC8]">
                  {selectedBuild.spells.winRate.toFixed(2)}% Win Rate • {selectedBuild.spells.games.toLocaleString()} Matches
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-[#283D4D] rounded border border-[#3A4A5C] flex items-center justify-center">
                  <span className="text-xs text-[#B4BEC8]">{selectedBuild.spells.spell1Id}</span>
                </div>
                <div className="w-16 h-16 bg-[#283D4D] rounded border border-[#3A4A5C] flex items-center justify-center">
                  <span className="text-xs text-[#B4BEC8]">{selectedBuild.spells.spell2Id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Core Items */}
          <div className="bg-[#0D121E] border border-[#283D4D] rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Core Items</h2>
            <div className="mb-4">
              <p className="text-sm text-[#B4BEC8]">
                {selectedBuild.items.winRate.toFixed(2)}% Win Rate • {selectedBuild.items.games.toLocaleString()} Matches
              </p>
            </div>
            <div className="flex gap-4">
              {selectedBuild.items.items.map((itemId, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 bg-[#283D4D] rounded border border-[#3A4A5C] flex items-center justify-center"
                  title={`Item ${itemId}`}
                >
                  <span className="text-xs text-[#B4BEC8]">{itemId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
