'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getChampionName, getChampionImageUrl, getSpellName } from '@/utils/championData';
import { getApiUrl } from '@/utils/api';

interface Player {
  summonerName: string;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  profileIconId: number;
  summonerId: string;
  participantId?: number;
  stats?: {
    wins: number;
    losses: number;
    winRate: number;
    mainRole: string | null;
  };
}

interface GameStartedEvent {
  gameId: string;
  teamId: string;
  region: string;
  roomKey: string;
  phase: 'ban' | 'loading' | 'in-game';
  gameStartTime: number;
  blueTeam: Player[];
  redTeam: Player[];
  teammates: Array<{
    summonerName: string;
    championId: number;
    spell1Id: number;
    spell2Id: number;
  }>;
  bannedChampions?: Array<{
    championId: number;
    teamId: number;
  }>;
}

// Role order: Top, Jungle, Mid, ADC, Support
const ROLE_ORDER = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

export default function LiveGamePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<GameStartedEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Connect to WebSocket
    const apiUrl = getApiUrl();
    const newSocket = io(apiUrl, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      setLoading(false);
    });

    newSocket.on('GAME_STARTED', async (event: GameStartedEvent) => {
      console.log('Game started:', event);
      
      // Fetch stats for all players
      const fetchPlayerStats = async (player: Player): Promise<Player> => {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(
            `${apiUrl}/stats/by-summoner/${encodeURIComponent(player.summonerName)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          if (response.ok) {
            const stats = await response.json();
            return { ...player, stats };
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
        
        return player;
      };

      // Fetch stats for both teams
      const blueTeamWithStats = await Promise.all(event.blueTeam.map(fetchPlayerStats));
      const redTeamWithStats = await Promise.all(event.redTeam.map(fetchPlayerStats));

      setGame({
        ...event,
        blueTeam: blueTeamWithStats,
        redTeam: redTeamWithStats,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from game server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[#B4BEC8]">Connecting to game server...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold mb-4 text-white">No Active Game</h2>
          <p className="text-[#78828C]">Start a League game to see the lobby here</p>
        </div>
      </div>
    );
  }

  // Determine user's team
  const userTeamId = game.teamId;
  const isUserBlueTeam = userTeamId === '100';

  // Order players by role (Top, Jungle, Mid, ADC, Support)
  // In ban phase, we order by participantId which typically follows role order
  const orderedBlueTeam = [...game.blueTeam].sort((a, b) => (a.participantId || 0) - (b.participantId || 0));
  const orderedRedTeam = [...game.redTeam].sort((a, b) => (a.participantId || 0) - (b.participantId || 0));

  // Determine phase display
  const phaseDisplay = {
    ban: { label: 'Ban Phase', color: 'bg-yellow-500', icon: '🚫' },
    loading: { label: 'Loading', color: 'bg-blue-500', icon: '⏳' },
    'in-game': { label: 'In Game', color: 'bg-green-500', icon: '⚔️' },
  }[game.phase || 'ban'];

  // Calculate time until game starts (if in ban phase)
  const timeUntilStart = game.gameStartTime ? game.gameStartTime - Date.now() : 0;
  const minutesUntilStart = Math.floor(timeUntilStart / 60000);
  const secondsUntilStart = Math.floor((timeUntilStart % 60000) / 1000);

  return (
    <div className="min-h-screen bg-[#0D121E]">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Live Game Lobby</h1>
          <div className={`px-4 py-2 ${phaseDisplay.color} text-white rounded-lg flex items-center gap-2 shadow-lg`}>
            <span>{phaseDisplay.icon}</span>
            <span className="font-medium">{phaseDisplay.label}</span>
            {game.phase === 'ban' && timeUntilStart > 0 && (
              <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded">
                {minutesUntilStart}:{secondsUntilStart.toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* Ban Phase Banner */}
        {game.phase === 'ban' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="font-semibold text-yellow-400">Champion Select - Ban Phase</h3>
                <p className="text-sm text-[#B4BEC8] mt-1">
                  Game detected! View picks and bans below. The game will start automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Banned Champions Display */}
        {game.bannedChampions && game.bannedChampions.length > 0 && (
          <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Banned Champions</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-3 text-blue-400">Blue Team Bans</h3>
              <div className="flex gap-2">
                {game.bannedChampions
                  .filter((ban) => ban.teamId === 100)
                  .map((ban, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded border-2 border-red-500"
                      title={`Banned: ${getChampionName(ban.championId)}`}
                    >
                      <img
                        src={getChampionImageUrl(ban.championId)}
                        alt={getChampionName(ban.championId)}
                        className="w-full h-full rounded opacity-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3 text-red-400">Red Team Bans</h3>
              <div className="flex gap-2">
                {game.bannedChampions
                  .filter((ban) => ban.teamId === 200)
                  .map((ban, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded border-2 border-red-500"
                      title={`Banned: ${getChampionName(ban.championId)}`}
                    >
                      <img
                        src={getChampionImageUrl(ban.championId)}
                        alt={getChampionName(ban.championId)}
                        className="w-full h-full rounded opacity-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Matchup View - Side by Side */}
      <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-[#283D4D]">
          {/* Blue Team (Left) */}
          <div className="bg-blue-500/5">
            <div className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 font-semibold text-center ${
              isUserBlueTeam ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#161C2A]' : ''
            }`}>
              Blue Team {isUserBlueTeam && '← Your Team'}
            </div>
            <div className="p-4 space-y-2">
              {orderedBlueTeam.map((player, index) => {
                const role = ROLE_ORDER[index] || 'UNKNOWN';
                const opponent = orderedRedTeam[index];
                
                return (
                  <div
                    key={player.summonerId}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isUserBlueTeam
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-[#283D4D] bg-[#0D121E]'
                    }`}
                  >
                    {/* Champion Icon */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-[#0D121E] rounded border-2 border-[#283D4D] overflow-hidden">
                        <img
                          src={getChampionImageUrl(player.championId)}
                          alt={getChampionName(player.championId)}
                          className="w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Role Badge */}
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                        {role.charAt(0)}
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-white">{player.summonerName}</div>
                      <div className="text-sm text-[#B4BEC8]">
                        {getChampionName(player.championId)}
                      </div>
                      {player.stats && (
                        <div className="text-xs text-[#78828C] mt-1">
                          {player.stats.wins}W / {player.stats.losses}L ({player.stats.winRate.toFixed(1)}%)
                        </div>
                      )}
                    </div>

                    {/* Summoner Spells */}
                    <div className="flex flex-col gap-1">
                      <div className="w-6 h-6 bg-[#0D121E] border border-[#283D4D] rounded" title={getSpellName(player.spell1Id)}></div>
                      <div className="w-6 h-6 bg-[#0D121E] border border-[#283D4D] rounded" title={getSpellName(player.spell2Id)}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Red Team (Right) */}
          <div className="bg-red-500/5">
            <div className={`bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 font-semibold text-center ${
              !isUserBlueTeam ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#161C2A]' : ''
            }`}>
              Red Team {!isUserBlueTeam && '← Your Team'}
            </div>
            <div className="p-4 space-y-2">
              {orderedRedTeam.map((player, index) => {
                const role = ROLE_ORDER[index] || 'UNKNOWN';
                const opponent = orderedBlueTeam[index];
                
                return (
                  <div
                    key={player.summonerId}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      !isUserBlueTeam
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-[#283D4D] bg-[#0D121E]'
                    }`}
                  >
                    {/* Summoner Spells */}
                    <div className="flex flex-col gap-1">
                      <div className="w-6 h-6 bg-[#0D121E] border border-[#283D4D] rounded" title={getSpellName(player.spell1Id)}></div>
                      <div className="w-6 h-6 bg-[#0D121E] border border-[#283D4D] rounded" title={getSpellName(player.spell2Id)}></div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="font-semibold truncate text-white">{player.summonerName}</div>
                      <div className="text-sm text-[#B4BEC8]">
                        {getChampionName(player.championId)}
                      </div>
                      {player.stats && (
                        <div className="text-xs text-[#78828C] mt-1">
                          {player.stats.wins}W / {player.stats.losses}L ({player.stats.winRate.toFixed(1)}%)
                        </div>
                      )}
                    </div>

                    {/* Champion Icon */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-[#0D121E] rounded border-2 border-[#283D4D] overflow-hidden">
                        <img
                          src={getChampionImageUrl(player.championId)}
                          alt={getChampionName(player.championId)}
                          className="w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Role Badge */}
                      <div className="absolute -bottom-1 -left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                        {role.charAt(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Role Labels */}
        <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 bg-gray-100 dark:bg-gray-700">
          <div className="px-4 py-2">
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
              {ROLE_ORDER.map((role, idx) => (
                <span key={role} className="w-24 text-center">
                  {role}
                </span>
              ))}
            </div>
          </div>
          <div className="px-4 py-2">
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
              {ROLE_ORDER.map((role, idx) => (
                <span key={role} className="w-24 text-center">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
