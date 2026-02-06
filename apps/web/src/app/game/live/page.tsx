'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getChampionName, getChampionImageUrl, getSpellName } from '@/utils/championData';

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
    const newSocket = io('http://localhost:4000', {
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
          const response = await fetch(
            `http://localhost:4000/stats/by-summoner/${encodeURIComponent(player.summonerName)}`,
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
      <div className="flex min-h-screen items-center justify-center">
        <p>Connecting to game server...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Active Game</h2>
          <p className="text-gray-500">Start a League game to see the lobby here</p>
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
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Live Game Lobby</h1>
        <div className={`px-4 py-2 ${phaseDisplay.color} text-white rounded flex items-center gap-2`}>
          <span>{phaseDisplay.icon}</span>
          <span>{phaseDisplay.label}</span>
          {game.phase === 'ban' && timeUntilStart > 0 && (
            <span className="ml-2 text-sm">
              ({minutesUntilStart}:{secondsUntilStart.toString().padStart(2, '0')})
            </span>
          )}
        </div>
      </div>

      {/* Ban Phase Banner */}
      {game.phase === 'ban' && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚫</span>
            <div>
              <h3 className="font-semibold">Champion Select - Ban Phase</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Game detected! View picks and bans below. The game will start automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banned Champions Display */}
      {game.bannedChampions && game.bannedChampions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Banned Champions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-blue-600">Blue Team Bans</h3>
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
              <h3 className="text-sm font-medium mb-2 text-red-600">Red Team Bans</h3>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
          {/* Blue Team (Left) */}
          <div className="bg-blue-50 dark:bg-blue-900/20">
            <div className={`bg-blue-600 text-white px-4 py-2 font-semibold text-center ${
              isUserBlueTeam ? 'ring-2 ring-yellow-400' : ''
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
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                      isUserBlueTeam
                        ? 'border-blue-400 bg-blue-100 dark:bg-blue-900/40'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Champion Icon */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded border-2 border-gray-400">
                        <img
                          src={getChampionImageUrl(player.championId)}
                          alt={getChampionName(player.championId)}
                          className="w-full h-full rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Role Badge */}
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-1 rounded">
                        {role.charAt(0)}
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{player.summonerName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {getChampionName(player.championId)}
                      </div>
                      {player.stats && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {player.stats.wins}W / {player.stats.losses}L ({player.stats.winRate.toFixed(1)}%)
                        </div>
                      )}
                    </div>

                    {/* Summoner Spells */}
                    <div className="flex flex-col gap-1">
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded border border-gray-400" title={getSpellName(player.spell1Id)}></div>
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded border border-gray-400" title={getSpellName(player.spell2Id)}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Red Team (Right) */}
          <div className="bg-red-50 dark:bg-red-900/20">
            <div className={`bg-red-600 text-white px-4 py-2 font-semibold text-center ${
              !isUserBlueTeam ? 'ring-2 ring-yellow-400' : ''
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
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                      !isUserBlueTeam
                        ? 'border-red-400 bg-red-100 dark:bg-red-900/40'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Summoner Spells */}
                    <div className="flex flex-col gap-1">
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded border border-gray-400" title={getSpellName(player.spell1Id)}></div>
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded border border-gray-400" title={getSpellName(player.spell2Id)}></div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="font-semibold truncate">{player.summonerName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {getChampionName(player.championId)}
                      </div>
                      {player.stats && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {player.stats.wins}W / {player.stats.losses}L ({player.stats.winRate.toFixed(1)}%)
                        </div>
                      )}
                    </div>

                    {/* Champion Icon */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded border-2 border-gray-400">
                        <img
                          src={getChampionImageUrl(player.championId)}
                          alt={getChampionName(player.championId)}
                          className="w-full h-full rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Role Badge */}
                      <div className="absolute -bottom-1 -left-1 bg-red-600 text-white text-xs px-1 rounded">
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
