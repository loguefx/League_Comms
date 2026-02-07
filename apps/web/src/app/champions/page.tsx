'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/utils/api';

interface ChampionStats {
  championId: number;
  rankTier: string;
  role: string | null;
  patch: string;
  matches: number;
  wins: number;
  winRate: number;
  pickRate: number;
}

export default function ChampionsPage() {
  const [champions, setChampions] = useState<ChampionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rank: 'PLATINUM_PLUS',
    role: '',
    patch: 'latest',
  });

  useEffect(() => {
    loadChampions();
  }, [filters]);

  const loadChampions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.rank) params.append('rank', filters.rank);
      if (filters.role) params.append('role', filters.role);
      if (filters.patch) params.append('patch', filters.patch);

      const apiUrl = getApiUrl();
      console.log(`[ChampionsPage] Fetching from: ${apiUrl}/champions?${params}`);
      
      const response = await fetch(`${apiUrl}/champions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[ChampionsPage] Received ${data.champions?.length || 0} champions`);
      setChampions(data.champions || []);
    } catch (error) {
      console.error('Error loading champions:', error);
      // Set empty array on error so UI shows "No data" instead of crashing
      setChampions([]);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="latest" className="bg-[#0D121E] text-white">Latest</option>
                <option value="14.1" className="bg-[#0D121E] text-white">14.1</option>
                <option value="14.2" className="bg-[#0D121E] text-white">14.2</option>
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
                // Group champions by role
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
                        <table className="w-full">
                          <thead className="bg-[#0D121E] border-b border-[#283D4D]">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                                Rank
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                                Champion
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                                Win Rate
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                                Pick Rate
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider">
                                Matches
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#283D4D]">
                            {roleChampions.map((champ, index) => (
                              <tr key={`${champ.championId}-${champ.role}`} className="hover:bg-[#0D121E] transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-[#B4BEC8] font-medium">
                                  #{index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-[#283D4D] rounded-lg mr-3 flex items-center justify-center">
                                      <span className="text-xs text-[#78828C]">{champ.championId}</span>
                                    </div>
                                    <span className="font-medium text-white">Champion {champ.championId}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className={`font-semibold ${champ.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {champ.winRate.toFixed(2)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-[#B4BEC8]">
                                  {champ.pickRate.toFixed(2)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-[#B4BEC8]">
                                  {champ.matches.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
