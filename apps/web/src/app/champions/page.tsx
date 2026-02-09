'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/utils/api';
import {
  preloadChampionData,
  getChampionNameSync,
  getChampionImageUrl,
  calculateTier,
  getTierColor,
  getTierBgColor,
} from '@/utils/championData';

interface ChampionStats {
  championId: number;
  games: number;
  wins: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  counterPicks?: number[]; // Array of champion IDs that counter this champion
  role?: string; // Optional - only present when "All Roles" is selected
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
  
  // Initialize filters from URL params or use defaults
  const [filters, setFilters] = useState({
    rank: searchParams.get('rank') || 'PLATINUM_PLUS',
    role: searchParams.get('role') || '',
    patch: searchParams.get('patch') || 'latest',
    region: searchParams.get('region') || 'world',
  });
  
  // Update filters when URL params change (e.g., when navigating back)
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

  // Preload champion data and fetch patches on mount
  useEffect(() => {
    preloadChampionData().then(() => {
      setChampionDataLoaded(true);
    });
    
    // Fetch available patches
    const fetchPatches = async () => {
      setPatchesLoading(true);
      try {
        const apiUrl = getApiUrl();
        console.log('[ChampionsPage] Fetching patches from:', `${apiUrl}/champions/patches`);
        
        const response = await fetch(`${apiUrl}/champions/patches`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('[ChampionsPage] Patches response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ChampionsPage] Patches API error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[ChampionsPage] Patches data received:', JSON.stringify(data, null, 2));
        console.log('[ChampionsPage] Patches array:', data.patches);
        console.log('[ChampionsPage] Latest patch:', data.latest);
        
        // Ensure patches is an array
        const patches = Array.isArray(data.patches) ? data.patches : [];
        console.log('[ChampionsPage] Processed patches array:', patches);
        console.log('[ChampionsPage] Patches count:', patches.length);
        
        if (patches.length > 0) {
          setAvailablePatches(patches);
          console.log('[ChampionsPage] Set availablePatches to:', patches);
          
          // Determine latest patch
          const latest = data.latest || patches[0];
          setLatestPatch(latest);
          console.log('[ChampionsPage] Set latestPatch to:', latest);
          
          // Update filter if it's still 'latest'
          setFilters(prev => {
            if (prev.patch === 'latest' || !prev.patch) {
              console.log('[ChampionsPage] Updating filter patch from', prev.patch, 'to', latest);
              return { ...prev, patch: latest };
            }
            return prev;
          });
        } else {
          // No patches available - might mean no matches ingested yet
          console.warn('[ChampionsPage] No patches available - database might be empty');
          console.warn('[ChampionsPage] Raw data received:', data);
          setAvailablePatches([]);
          setLatestPatch(null);
        }
      } catch (error) {
        console.error('[ChampionsPage] Failed to fetch patches:', error);
        if (error instanceof Error) {
          console.error('[ChampionsPage] Error message:', error.message);
          console.error('[ChampionsPage] Error stack:', error.stack);
        }
        // Set empty array on error so UI shows "No patches available"
        setAvailablePatches([]);
        setLatestPatch(null);
      } finally {
        setPatchesLoading(false);
        console.log('[ChampionsPage] Finished fetching patches, loading set to false');
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

  // Helper function to render champions table
  const renderChampionsTable = (roleChampions: ChampionStats[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0D121E] border-b border-[#283D4D]">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Champion
              </th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Tier
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Pick Rate
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Ban Rate
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Counter Picks
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                Matches
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#283D4D]">
            {roleChampions.map((champ, index) => {
              const tier = calculateTier(champ.winRate, champ.pickRate, champ.games);
              const championName = getChampionNameSync(champ.championId);
              const championImageUrl = getChampionImageUrl(champ.championId);

              return (
                <tr key={`${champ.championId}-${champ.role || 'all'}`} className="hover:bg-[#0D121E] transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-[#B4BEC8] font-medium">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        const params = new URLSearchParams({
                          rank: filters.rank,
                          role: filters.role || 'ALL',
                          patch: filters.patch,
                          region: filters.region,
                        });
                        router.push(`/champions/${champ.championId}?${params}`);
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg mr-3 overflow-hidden flex-shrink-0">
                        <img
                          src={championImageUrl}
                          alt={championName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Unknown.png`;
                          }}
                        />
                      </div>
                      <span className="font-medium text-white">{championName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getTierBgColor(tier)} ${getTierColor(tier)}`}
                    >
                      {tier}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className={`font-semibold ${champ.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {champ.winRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-[#B4BEC8]">
                    {champ.pickRate.toFixed(2)}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-[#B4BEC8]">
                    {champ.banRate?.toFixed(2) || '0.00'}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {champ.counterPicks && champ.counterPicks.length > 0 ? (
                          champ.counterPicks.slice(0, 6).map((counterChampId) => {
                            const counterName = getChampionNameSync(counterChampId);
                            const counterImageUrl = getChampionImageUrl(counterChampId);
                            return (
                              <div
                                key={counterChampId}
                                className="w-6 h-6 rounded-full overflow-hidden border border-[#3A4A5C] flex-shrink-0"
                                title={counterName}
                              >
                                <img
                                  src={counterImageUrl}
                                  alt={counterName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Unknown.png`;
                                  }}
                                />
                              </div>
                            );
                          })
                        ) : (
                          // Show placeholders if no counter picks data
                          [1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-[#283D4D] border border-[#3A4A5C] flex items-center justify-center text-[8px] text-[#78828C]"
                              title="No counter pick data available"
                            >
                              ?
                            </div>
                          ))
                        )}
                      </div>
                      <span className="text-[#78828C] text-xs ml-2">→</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-[#B4BEC8]">
                    {champ.games?.toLocaleString() || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const loadChampions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.rank) params.append('rank', filters.rank);
      if (filters.role) params.append('role', filters.role);
      if (filters.patch) params.append('patch', filters.patch);
      if (filters.region) params.append('region', filters.region);

      const apiUrl = getApiUrl();
      const fullUrl = `${apiUrl}/champions?${params}`;
      console.log(`[ChampionsPage] Fetching from: ${fullUrl}`);
      console.log(`[ChampionsPage] API URL: ${apiUrl}`);
      console.log(`[ChampionsPage] Current hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'N/A'}`);
      
      // Create timeout controller for fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let response: Response;
      try {
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        // Handle network errors (connection refused, CORS, etc.)
        const errorMessage = fetchError?.message || String(fetchError) || 'Unknown fetch error';
        const isConnectionError = 
          errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('ERR_CONNECTION_REFUSED') ||
          errorMessage.includes('NetworkError') ||
          fetchError?.name === 'AbortError';
        
        throw new Error(
          isConnectionError
            ? `Cannot connect to API server at ${apiUrl}. Make sure the API server is running on port 4000.`
            : `Network error: ${errorMessage}`
        );
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      console.log(`[ChampionsPage] Received ${data.champions?.length || 0} champions`);
      setChampions(data.champions || []);
    } catch (error: any) {
      // Improved error handling that works with all error types
      const errorMessage = error?.message || String(error) || 'Unknown error';
      const errorName = error?.name || 'Error';
      
      console.error('Error loading champions:', errorMessage);
      console.error('Error type:', errorName);
      console.error('API URL:', getApiUrl());
      
      // Set empty array on error so UI shows "No data" instead of crashing
      setChampions([]);
      
      // Show user-friendly error message (only in development or if it's a connection error)
      if (errorMessage.includes('Cannot connect') || errorMessage.includes('Failed to fetch')) {
        console.warn('API connection failed. Make sure the API server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D121E]">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 text-white">Champions Tier List</h1>

        {/* Filters */}
        <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#B4BEC8]">Rank Tier</label>
              <select
                value={filters.rank}
                onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                className="w-full px-4 py-3 bg-[#0D121E] border border-[#283D4D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CHALLENGER" className="bg-[#0D121E] text-white">Challenger</option>
                <option value="GRANDMASTER_PLUS" className="bg-[#0D121E] text-white">Grandmaster+</option>
                <option value="MASTER_PLUS" className="bg-[#0D121E] text-white">Master+</option>
                <option value="DIAMOND_PLUS" className="bg-[#0D121E] text-white">Diamond+</option>
                <option value="EMERALD_PLUS" className="bg-[#0D121E] text-white">Emerald+</option>
                <option value="PLATINUM_PLUS" className="bg-[#0D121E] text-white">Platinum+</option>
                <option value="GOLD_PLUS" className="bg-[#0D121E] text-white">Gold+</option>
                <option value="SILVER_PLUS" className="bg-[#0D121E] text-white">Silver+</option>
                <option value="BRONZE_PLUS" className="bg-[#0D121E] text-white">Bronze+</option>
                <option value="IRON_PLUS" className="bg-[#0D121E] text-white">Iron+</option>
                <option value="ALL_RANKS" className="bg-[#0D121E] text-white">All Ranks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#B4BEC8]">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-4 py-3 bg-[#0D121E] border border-[#283D4D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" className="bg-[#0D121E] text-white">All Roles</option>
                <option value="TOP" className="bg-[#0D121E] text-white">Top Lane</option>
                <option value="JUNGLE" className="bg-[#0D121E] text-white">Jungle</option>
                <option value="MID" className="bg-[#0D121E] text-white">Mid Lane</option>
                <option value="ADC" className="bg-[#0D121E] text-white">ADC / Bot Lane</option>
                <option value="SUPPORT" className="bg-[#0D121E] text-white">Support</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#B4BEC8]">Patch</label>
              <select
                value={filters.patch}
                onChange={(e) => setFilters({ ...filters, patch: e.target.value })}
                className="w-full px-4 py-3 bg-[#0D121E] border border-[#283D4D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {patchesLoading ? (
                  <option value="latest" className="bg-[#0D121E] text-white">Loading patches...</option>
                ) : availablePatches.length > 0 ? (
                  availablePatches.map((patch) => (
                    <option key={patch} value={patch} className="bg-[#0D121E] text-white">
                      {patch}{patch === latestPatch ? ' (Latest)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="latest" className="bg-[#0D121E] text-white">No patches available</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#B4BEC8]">Region</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-4 py-3 bg-[#0D121E] border border-[#283D4D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="world" className="bg-[#0D121E] text-white">World (All Regions)</option>
                <option value="na1" className="bg-[#0D121E] text-white">North America</option>
                <option value="euw1" className="bg-[#0D121E] text-white">Europe West</option>
                <option value="eun1" className="bg-[#0D121E] text-white">Europe Nordic & East</option>
                <option value="kr" className="bg-[#0D121E] text-white">Korea</option>
                <option value="br1" className="bg-[#0D121E] text-white">Brazil</option>
                <option value="la1" className="bg-[#0D121E] text-white">Latin America North</option>
                <option value="la2" className="bg-[#0D121E] text-white">Latin America South</option>
                <option value="oc1" className="bg-[#0D121E] text-white">Oceania</option>
                <option value="ru" className="bg-[#0D121E] text-white">Russia</option>
                <option value="tr1" className="bg-[#0D121E] text-white">Turkey</option>
                <option value="jp1" className="bg-[#0D121E] text-white">Japan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Champion Tables by Role */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl shadow-lg p-8 text-center text-[#B4BEC8]">
              Loading...
            </div>
          ) : champions.length === 0 ? (
            <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl shadow-lg p-8 text-center text-[#B4BEC8]">
              No champion data available. Seed the database to populate champion statistics.
            </div>
          ) : (
            <>
              {(() => {
                // If a specific role is selected, don't group (all champions are for that role)
                // If "All Roles" is selected, group by role if role data is available
                const shouldGroup = !filters.role && champions.some((champ) => champ.role);

                if (!shouldGroup) {
                  // Single table for selected role or when no role data available
                  const roleLabels: Record<string, string> = {
                    TOP: 'Top Lane',
                    JUNGLE: 'Jungle',
                    MID: 'Mid Lane',
                    ADC: 'ADC / Bot Lane',
                    SUPPORT: 'Support',
                    '': 'All Roles',
                  };
                  const currentRoleLabel = roleLabels[filters.role || ''] || 'Champions';

                  return (
                    <div key="single" className="bg-[#161C2A] border border-[#283D4D] rounded-xl shadow-lg overflow-hidden">
                      <div className="bg-[#0D121E] border-b border-[#283D4D] px-6 py-4">
                        <h2 className="text-xl font-bold text-white">
                          {currentRoleLabel} ({champions.length} champions)
                        </h2>
                        <p className="text-sm text-[#B4BEC8] mt-1">
                          Sorted by win rate (highest to lowest)
                        </p>
                      </div>
                      {renderChampionsTable(champions)}
                    </div>
                  );
                }

                // Group champions by role (for "All Roles" view)
                const roleGroups: Record<string, ChampionStats[]> = {
                  TOP: [],
                  JUNGLE: [],
                  MID: [],
                  ADC: [],
                  SUPPORT: [],
                  '': [], // Any/Unknown role
                };

                champions.forEach((champ) => {
                  const role = champ.role || '';
                  if (!roleGroups[role]) {
                    roleGroups[role] = [];
                  }
                  roleGroups[role].push(champ);
                });

                const roleOrder = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT', ''];
                const roleLabels: Record<string, string> = {
                  TOP: 'Top Lane',
                  JUNGLE: 'Jungle',
                  MID: 'Mid Lane',
                  ADC: 'ADC / Bot Lane',
                  SUPPORT: 'Support',
                  '': 'Other / Any Role',
                };

                return roleOrder
                  .filter((role) => (roleGroups[role] || []).length > 0)
                  .map((role) => {
                    const roleChampions = roleGroups[role] || [];

                    return (
                      <div key={role} className="bg-[#161C2A] border border-[#283D4D] rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-[#0D121E] border-b border-[#283D4D] px-6 py-4">
                          <h2 className="text-xl font-bold text-white">
                            {roleLabels[role]} ({roleChampions.length} champions)
                          </h2>
                          <p className="text-sm text-[#B4BEC8] mt-1">
                            Sorted by win rate (highest to lowest)
                          </p>
                        </div>
                        {renderChampionsTable(roleChampions)}
                      </div>
                    );
                  });
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
