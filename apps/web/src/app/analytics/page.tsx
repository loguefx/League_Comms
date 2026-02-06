'use client';

import { useEffect, useState } from 'react';

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

export default function AnalyticsPage() {
  const [champions, setChampions] = useState<ChampionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rank: 'EMERALD_PLUS',
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

      const response = await fetch(`http://localhost:4000/analytics/champions?${params}`);
      const data = await response.json();
      setChampions(data.champions || []);
    } catch (error) {
      console.error('Error loading champions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Champion Analytics</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rank Tier</label>
            <select
              value={filters.rank}
              onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700"
            >
              <option value="EMERALD_PLUS">Emerald+</option>
              <option value="DIAMOND_PLUS">Diamond+</option>
              <option value="PLATINUM_PLUS">Platinum+</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
              <option value="IRON">Iron</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700"
            >
              <option value="">All Roles</option>
              <option value="TOP">Top</option>
              <option value="JUNGLE">Jungle</option>
              <option value="MID">Mid</option>
              <option value="ADC">ADC</option>
              <option value="SUPPORT">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Patch</label>
            <select
              value={filters.patch}
              onChange={(e) => setFilters({ ...filters, patch: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700"
            >
              <option value="latest">Latest</option>
              <option value="14.1">14.1</option>
              <option value="14.2">14.2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Champion Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Champion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Win Rate</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pick Rate</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Matches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {champions.map((champ) => (
                <tr key={`${champ.championId}-${champ.role}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded mr-3"></div>
                      <span className="font-medium">Champion {champ.championId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {champ.role || 'Any'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`font-semibold ${champ.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                      {champ.winRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {champ.pickRate.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {champ.matches.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
