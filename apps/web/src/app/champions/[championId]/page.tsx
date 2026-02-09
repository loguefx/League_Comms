'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/utils/api';
import { getChampionNameSync, getChampionImageUrl, preloadChampionData } from '@/utils/championData';
import { 
  preloadRuneData, 
  getRuneImageUrl, 
  getRuneName, 
  getRuneStyleImageUrl
} from '@/utils/runeData';
import { getLatestDataDragonVersion } from '@/utils/championData';

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

interface ItemBuildType {
  items: number[];
  winRate: number;
  games: number;
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
  itemBuilds?: {
    starting: ItemBuildType[];
    core: ItemBuildType[];
    fourth: ItemBuildType[];
    fifth: ItemBuildType[];
    sixth: ItemBuildType[];
  };
  builds: BuildArchetype[];
}

// Get spell image URL
function getSpellImageUrl(spellId: number, version: string = '14.1.1'): string {
  const spellMap: Record<number, string> = {
    1: 'SummonerBoost', // Cleanse
    3: 'SummonerExhaust', // Exhaust
    4: 'SummonerFlash', // Flash
    6: 'SummonerHaste', // Ghost
    7: 'SummonerHeal', // Heal
    11: 'SummonerSmite', // Smite
    12: 'SummonerTeleport', // Teleport
    13: 'SummonerMana', // Clarity
    14: 'SummonerIgnite', // Ignite
    21: 'SummonerBarrier', // Barrier
  };
  const spellName = spellMap[spellId] || 'SummonerFlash';
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellName}.png`;
}

// Get item image URL
function getItemImageUrl(itemId: number, version?: string): string {
  const ddVersion = version || (typeof window !== 'undefined' && (window as any).__DD_VERSION__) || '14.1.1';
  return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/item/${itemId}.png`;
}

export default function ChampionBuildPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const championId = parseInt(params.championId as string, 10);

  const [build, setBuild] = useState<ChampionBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [championDataLoaded, setChampionDataLoaded] = useState(false);
  const [runeDataLoaded, setRuneDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildIndex, setSelectedBuildIndex] = useState(0);
  const [runeImages, setRuneImages] = useState<Map<number, string>>(new Map());
  const [runeNames, setRuneNames] = useState<Map<number, string>>(new Map());
  const [runeStyleImages, setRuneStyleImages] = useState<Map<number, string>>(new Map());
  const [ddVersion, setDdVersion] = useState<string>('14.1.1');

  const rank = searchParams.get('rank') || 'ALL_RANKS';
  const role = searchParams.get('role') || 'ALL';
  const patch = searchParams.get('patch') || 'latest';
  const region = searchParams.get('region') || 'world';

  useEffect(() => {
    Promise.all([
      preloadChampionData(),
      preloadRuneData()
    ]).then(() => {
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

        let response;
        try {
          response = await fetch(`${apiUrl}/champions/${championId}/build?${params}`);
        } catch (fetchError: any) {
          // Handle network errors (connection refused, timeout, etc.)
          console.error('[loadBuild] Failed to fetch from server:', fetchError);
          if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('ERR_CONNECTION_REFUSED')) {
            throw new Error('Cannot connect to the API server. Please ensure the server is running on port 4000.');
          }
          throw new Error(`Network error: ${fetchError.message}`);
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }

        let data;
        try {
          // Try to parse JSON response
          const text = await response.text();
          data = JSON.parse(text);
        } catch (parseError: any) {
          // If JSON parsing fails, it might be due to BigInt serialization
          console.error('[loadBuild] Failed to parse JSON response:', parseError);
          throw new Error(`Failed to parse server response: ${parseError.message}`);
        }
        
        if (data.error) {
          // Check if it's a serialization error and provide helpful message
          if (data.error.includes('serialization') || data.error.includes('BigInt')) {
            throw new Error('Server encountered a data processing error. The API server may need to be restarted. Please try again in a moment.');
          }
          throw new Error(data.error);
        }

        console.log('[loadBuild] ========== FULL BUILD DATA RECEIVED ==========');
        console.log('[loadBuild] Champion ID:', data.championId);
        console.log('[loadBuild] Build archetypes count:', data.builds?.length || 0);
        console.log('[loadBuild] Full itemBuilds object:', JSON.stringify(data.itemBuilds, null, 2));
        console.log('[loadBuild] Item builds breakdown:', {
          hasItemBuilds: !!data.itemBuilds,
          starting: {
            exists: !!data.itemBuilds?.starting,
            length: data.itemBuilds?.starting?.length || 0,
            data: data.itemBuilds?.starting || []
          },
          core: {
            exists: !!data.itemBuilds?.core,
            length: data.itemBuilds?.core?.length || 0,
            data: data.itemBuilds?.core || []
          },
          fourth: {
            exists: !!data.itemBuilds?.fourth,
            length: data.itemBuilds?.fourth?.length || 0,
            data: data.itemBuilds?.fourth || []
          },
          fifth: {
            exists: !!data.itemBuilds?.fifth,
            length: data.itemBuilds?.fifth?.length || 0,
            data: data.itemBuilds?.fifth || []
          },
          sixth: {
            exists: !!data.itemBuilds?.sixth,
            length: data.itemBuilds?.sixth?.length || 0,
            data: data.itemBuilds?.sixth || []
          }
        });
        console.log('[loadBuild] First build archetype runes:', data.builds?.[0]?.runes);
        console.log('[loadBuild] ==============================================');

        setBuild(data);
        if (data.builds && data.builds.length > 0) {
          setSelectedBuildIndex(0);
          
          // Load rune images and style images - ensure rune data is preloaded first
          const loadRuneImages = async () => {
            // Ensure rune data is loaded
            await preloadRuneData();
            
            // Get Data Dragon version for spell/item images
            try {
              const version = await getLatestDataDragonVersion();
              if (version) {
                setDdVersion(version);
                if (typeof window !== 'undefined') {
                  (window as any).__DD_VERSION__ = version;
                }
              }
            } catch (err) {
              console.warn('Failed to get Data Dragon version:', err);
            }
            
            const runeImgMap = new Map<number, string>();
            const runeNameMap = new Map<number, string>();
            const styleImgMap = new Map<number, string>();
            
            for (const buildArchetype of data.builds) {
              // Load rune style images
              if (!styleImgMap.has(buildArchetype.runes.primaryStyleId)) {
                try {
                  console.log(`[loadRuneImages] Loading primary style ${buildArchetype.runes.primaryStyleId}`);
                  const primaryStyleUrl = await getRuneStyleImageUrl(buildArchetype.runes.primaryStyleId);
                  console.log(`[loadRuneImages] Primary style ${buildArchetype.runes.primaryStyleId} loaded: ${primaryStyleUrl}`);
                  styleImgMap.set(buildArchetype.runes.primaryStyleId, primaryStyleUrl);
                } catch (err) {
                  console.error(`[loadRuneImages] Failed to load primary style ${buildArchetype.runes.primaryStyleId}:`, err);
                }
              }
              if (!styleImgMap.has(buildArchetype.runes.subStyleId)) {
                try {
                  console.log(`[loadRuneImages] Loading sub style ${buildArchetype.runes.subStyleId}`);
                  const subStyleUrl = await getRuneStyleImageUrl(buildArchetype.runes.subStyleId);
                  console.log(`[loadRuneImages] Sub style ${buildArchetype.runes.subStyleId} loaded: ${subStyleUrl}`);
                  styleImgMap.set(buildArchetype.runes.subStyleId, subStyleUrl);
                } catch (err) {
                  console.error(`[loadRuneImages] Failed to load sub style ${buildArchetype.runes.subStyleId}:`, err);
                }
              }
              
              // Load rune images
              for (const perkId of buildArchetype.runes.perkIds) {
                if (!runeImgMap.has(perkId)) {
                  try {
                    console.log(`[loadRuneImages] Loading rune perk ${perkId}`);
                    const imgUrl = await getRuneImageUrl(perkId);
                    const name = await getRuneName(perkId);
                    if (imgUrl && name && !imgUrl.includes('StatModsEmpty')) {
                      console.log(`[loadRuneImages] Rune perk ${perkId} loaded: ${imgUrl} (${name})`);
                      runeImgMap.set(perkId, imgUrl);
                      runeNameMap.set(perkId, name);
                    } else {
                      console.warn(`[loadRuneImages] Rune perk ${perkId} returned empty/invalid URL or name:`, { imgUrl, name });
                    }
                  } catch (err) {
                    console.error(`[loadRuneImages] Failed to load rune for perk ${perkId}:`, err);
                  }
                }
              }
            }
            
            console.log(`[loadRuneImages] ========== RUNE IMAGE LOADING SUMMARY ==========`);
            console.log(`[loadRuneImages] Loaded ${runeImgMap.size} rune images, ${runeNameMap.size} rune names, ${styleImgMap.size} style images`);
            console.log(`[loadRuneImages] Rune images map:`, Array.from(runeImgMap.entries()));
            console.log(`[loadRuneImages] Rune names map:`, Array.from(runeNameMap.entries()));
            console.log(`[loadRuneImages] Style images map:`, Array.from(styleImgMap.entries()));
            console.log(`[loadRuneImages] All perk IDs from builds:`, data.builds.flatMap(b => b.runes.perkIds));
            console.log(`[loadRuneImages] Missing rune images:`, data.builds.flatMap(b => b.runes.perkIds).filter(id => !runeImgMap.has(id)));
            console.log(`[loadRuneImages] ================================================`);
            
            setRuneImages(runeImgMap);
            setRuneNames(runeNameMap);
            setRuneStyleImages(styleImgMap);
            setRuneDataLoaded(true);
          };
          
          loadRuneImages();
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

  if (loading || !championDataLoaded || !runeDataLoaded) {
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
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] border border-[#334155] flex items-center justify-center overflow-hidden">
                    {runeStyleImages.get(selectedBuild.runes.primaryStyleId) ? (
                      <img
                        src={runeStyleImages.get(selectedBuild.runes.primaryStyleId)!}
                        alt={`Style ${selectedBuild.runes.primaryStyleId}`}
                        className="w-full h-full object-cover"
                        onError={async (e) => {
                          console.error(`[RuneStyleImage] Failed to load primary style ${selectedBuild.runes.primaryStyleId}: ${runeStyleImages.get(selectedBuild.runes.primaryStyleId)}`);
                          try {
                            const { getRuneStyleImageUrl } = await import('@/utils/runeData');
                            const newUrl = await getRuneStyleImageUrl(selectedBuild.runes.primaryStyleId);
                            if (newUrl) {
                              (e.target as HTMLImageElement).src = newUrl;
                              // Update the state
                              setRuneStyleImages(prev => new Map(prev).set(selectedBuild.runes.primaryStyleId, newUrl));
                            } else {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">Style ${selectedBuild.runes.primaryStyleId}</span>`;
                            }
                          } catch (err) {
                            console.error(`[RuneStyleImage] Error reloading style ${selectedBuild.runes.primaryStyleId}:`, err);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">Style ${selectedBuild.runes.primaryStyleId}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs text-[#94A3B8]">Style {selectedBuild.runes.primaryStyleId}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedBuild.runes.perkIds.slice(0, 4).map((perkId, idx) => {
                      const runeImg = runeImages.get(perkId);
                      const runeName = runeNames.get(perkId) || `Perk ${perkId}`;
                      console.log(`[RuneRender] Rendering primary rune ${perkId}:`, { runeImg, runeName, hasImage: !!runeImg, runeImagesSize: runeImages.size });
                      return (
                        <div
                          key={`${perkId}-${idx}`}
                          className="w-10 h-10 rounded-lg bg-[#0F172A] border-2 border-[#334155] hover:border-blue-500/50 transition-colors flex items-center justify-center group relative overflow-hidden"
                          title={runeName}
                        >
                          {runeImg ? (
                            <img
                              src={runeImg}
                              alt={runeName}
                              className="w-full h-full object-cover"
                              onError={async (e) => {
                                console.error(`[RuneImage] Failed to load rune image for perk ${perkId}: ${runeImg}`);
                                // Try to reload the rune image
                                try {
                                  const { getRuneImageUrl } = await import('@/utils/runeData');
                                  const newUrl = await getRuneImageUrl(perkId);
                                  if (newUrl && newUrl !== runeImg) {
                                    (e.target as HTMLImageElement).src = newUrl;
                                  } else {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkId}</span>`;
                                  }
                                } catch (err) {
                                  console.error(`[RuneImage] Error reloading rune ${perkId}:`, err);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkId}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors">{perkId}</span>
                          )}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            {runeName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Secondary Runes */}
              <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-[#334155]">
                <div className="text-xs text-[#64748B] mb-3 font-semibold uppercase tracking-wider">Secondary</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] border border-[#334155] flex items-center justify-center overflow-hidden">
                    {runeStyleImages.get(selectedBuild.runes.subStyleId) ? (
                      <img
                        src={runeStyleImages.get(selectedBuild.runes.subStyleId)!}
                        alt={`Style ${selectedBuild.runes.subStyleId}`}
                        className="w-full h-full object-cover"
                        onError={async (e) => {
                          console.error(`[RuneStyleImage] Failed to load sub style ${selectedBuild.runes.subStyleId}: ${runeStyleImages.get(selectedBuild.runes.subStyleId)}`);
                          try {
                            const { getRuneStyleImageUrl } = await import('@/utils/runeData');
                            const newUrl = await getRuneStyleImageUrl(selectedBuild.runes.subStyleId);
                            if (newUrl) {
                              (e.target as HTMLImageElement).src = newUrl;
                              // Update the state
                              setRuneStyleImages(prev => new Map(prev).set(selectedBuild.runes.subStyleId, newUrl));
                            } else {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">Style ${selectedBuild.runes.subStyleId}</span>`;
                            }
                          } catch (err) {
                            console.error(`[RuneStyleImage] Error reloading style ${selectedBuild.runes.subStyleId}:`, err);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">Style ${selectedBuild.runes.subStyleId}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs text-[#94A3B8]">Style {selectedBuild.runes.subStyleId}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedBuild.runes.perkIds.slice(4, 6).map((perkId, idx) => {
                      const runeImg = runeImages.get(perkId);
                      const runeName = runeNames.get(perkId) || `Perk ${perkId}`;
                      console.log(`[RuneRender] Rendering secondary rune ${perkId}:`, { runeImg, runeName, hasImage: !!runeImg });
                      return (
                        <div
                          key={`${perkId}-${idx}`}
                          className="w-10 h-10 rounded-lg bg-[#0F172A] border-2 border-[#334155] hover:border-purple-500/50 transition-colors flex items-center justify-center group relative overflow-hidden"
                          title={runeName}
                        >
                          {runeImg ? (
                            <img
                              src={runeImg}
                              alt={runeName}
                              className="w-full h-full object-cover"
                              onError={async (e) => {
                                console.error(`[RuneImage] Failed to load rune image for perk ${perkId}: ${runeImg}`);
                                // Try to reload the rune image
                                try {
                                  const { getRuneImageUrl } = await import('@/utils/runeData');
                                  const newUrl = await getRuneImageUrl(perkId);
                                  if (newUrl && newUrl !== runeImg) {
                                    (e.target as HTMLImageElement).src = newUrl;
                                  } else {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkId}</span>`;
                                  }
                                } catch (err) {
                                  console.error(`[RuneImage] Error reloading rune ${perkId}:`, err);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${perkId}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xs text-[#94A3B8] group-hover:text-purple-400 transition-colors">{perkId}</span>
                          )}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            {runeName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                  <div className="w-16 h-16 rounded-xl bg-[#1E293B] border-2 border-[#334155] hover:border-blue-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden">
                    <img
                      src={getSpellImageUrl(selectedBuild.spells.spell1Id)}
                      alt={`Spell ${selectedBuild.spells.spell1Id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors font-semibold">${selectedBuild.spells.spell1Id}</span>`;
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Spell {selectedBuild.spells.spell1Id}
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-[#1E293B] border-2 border-[#334155] hover:border-blue-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden">
                    <img
                      src={getSpellImageUrl(selectedBuild.spells.spell2Id, ddVersion)}
                      alt={`Spell ${selectedBuild.spells.spell2Id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8] group-hover:text-blue-400 transition-colors font-semibold">${selectedBuild.spells.spell2Id}</span>`;
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Spell {selectedBuild.spells.spell2Id}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Items - U.GG Style Layout */}
            {(() => {
              console.log('[ItemBuildRender] Rendering item builds section');
              console.log('[ItemBuildRender] build.itemBuilds exists:', !!build.itemBuilds);
              console.log('[ItemBuildRender] build.itemBuilds:', build.itemBuilds);
              console.log('[ItemBuildRender] Starting items length:', build.itemBuilds?.starting?.length || 0);
              console.log('[ItemBuildRender] Core items length:', build.itemBuilds?.core?.length || 0);
              console.log('[ItemBuildRender] Fourth items length:', build.itemBuilds?.fourth?.length || 0);
              console.log('[ItemBuildRender] Fifth items length:', build.itemBuilds?.fifth?.length || 0);
              console.log('[ItemBuildRender] Sixth items length:', build.itemBuilds?.sixth?.length || 0);
              return null;
            })()}
            {build.itemBuilds && (
              <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#1E293B] rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Item Build</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Starting Items */}
                  {build.itemBuilds.starting.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Starting Items</h3>
                      {build.itemBuilds.starting.slice(0, 1).map((buildOption, optIdx) => (
                        <div key={optIdx} className="mb-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => (
                              <div
                                key={idx}
                                className="w-12 h-12 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden"
                                title={`Item ${itemId}`}
                              >
                                <img
                                  src={getItemImageUrl(itemId, ddVersion)}
                                  alt={`Item ${itemId}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span> Matches
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Core Items */}
                  {build.itemBuilds.core.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Core Items</h3>
                      {build.itemBuilds.core.slice(0, 1).map((buildOption, optIdx) => (
                        <div key={optIdx} className="mb-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => (
                              <div
                                key={idx}
                                className="w-12 h-12 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden"
                                title={`Item ${itemId}`}
                              >
                                <img
                                  src={getItemImageUrl(itemId, ddVersion)}
                                  alt={`Item ${itemId}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span> Matches
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fourth Item Options */}
                  {build.itemBuilds.fourth.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Fourth Item</h3>
                      {build.itemBuilds.fourth.slice(0, 3).map((buildOption, optIdx) => (
                        <div key={optIdx} className="mb-3">
                          <div className="flex gap-2 mb-1">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden"
                                title={`Item ${itemId}`}
                              >
                                <img
                                  src={getItemImageUrl(itemId, ddVersion)}
                                  alt={`Item ${itemId}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fifth Item Options */}
                  {build.itemBuilds.fifth.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Fifth Item</h3>
                      {build.itemBuilds.fifth.slice(0, 3).map((buildOption, optIdx) => (
                        <div key={optIdx} className="mb-3">
                          <div className="flex gap-2 mb-1">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden"
                                title={`Item ${itemId}`}
                              >
                                <img
                                  src={getItemImageUrl(itemId, ddVersion)}
                                  alt={`Item ${itemId}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sixth Item Options */}
                  {build.itemBuilds.sixth.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Sixth Item</h3>
                      {build.itemBuilds.sixth.slice(0, 3).map((buildOption, optIdx) => (
                        <div key={optIdx} className="mb-3">
                          <div className="flex gap-2 mb-1">
                            {buildOption.items.filter(itemId => itemId > 0).map((itemId, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 rounded-lg bg-[#1E293B] border-2 border-[#334155] hover:border-amber-500/50 transition-all hover:scale-110 flex items-center justify-center group relative overflow-hidden"
                                title={`Item ${itemId}`}
                              >
                                <img
                                  src={getItemImageUrl(itemId, ddVersion)}
                                  alt={`Item ${itemId}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-[#94A3B8]">${itemId}</span>`;
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            <span className="text-emerald-400">{buildOption.winRate.toFixed(2)}%</span> WR •{' '}
                            <span className="text-white">{buildOption.games.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
