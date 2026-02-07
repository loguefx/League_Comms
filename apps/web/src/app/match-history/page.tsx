'use client';

import { useEffect, useState } from 'react';
import { calculateOPScore, getOPScoreRank } from '@/utils/opScore';
import { getChampionName, getChampionImageUrl } from '@/utils/championData';

interface MatchParticipant {
  summonerName: string;
  championId: number;
  championName: string;
  teamId: number;
  kills: number;
  deaths: number;
  assists: number;
  damageDealtToChampions: number;
  totalDamageDealt: number;
  wardsPlaced: number;
  wardsKilled: number;
  controlWardsPlaced: number;
  totalMinionsKilled: number;
  goldEarned: number;
  level: number;
  items: number[];
  summoner1Id: number;
  summoner2Id: number;
  perks: any;
  win: boolean;
  individualPosition?: string;
  rank?: string;
}

interface Match {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  gameType: string;
  participants: MatchParticipant[];
  teams: Array<{
    teamId: number;
    win: boolean;
    objectives: {
      dragon: { kills: number };
      baron: { kills: number };
      riftHerald: { kills: number };
      tower: { kills: number };
      inhibitor: { kills: number };
    };
  }>;
}

export default function MatchHistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'team-analysis'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatchHistory();
  }, []);

  const loadMatchHistory = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch match history
      const response = await fetch('http://localhost:4000/stats/match-history?count=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const matchData = await response.json();
        setMatches(matchData);
      }
    } catch (error) {
      console.error('Error loading match history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[#B4BEC8]">Loading match history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D121E]">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 text-white">Match History</h1>

      {selectedMatch ? (
        <MatchDetailView match={selectedMatch} activeTab={activeTab} setActiveTab={setActiveTab} onBack={() => setSelectedMatch(null)} />
      ) : (
        <MatchListView matches={matches} onSelectMatch={setSelectedMatch} />
      )}
    </div>
  );
}

function MatchListView({ matches, onSelectMatch }: { matches: Match[]; onSelectMatch: (match: Match) => void }) {
  // Get current user's summoner name from localStorage or context
  const [userSummonerName, setUserSummonerName] = useState<string | null>(null);

  useEffect(() => {
    // Try to get user's summoner name from profile
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('http://localhost:4000/stats/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          // Store summoner name if available
          // This is a placeholder - you'd get it from the profile
        });
    }
  }, []);

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-[#B4BEC8] text-lg">No match history available</p>
        <p className="text-sm text-[#78828C] mt-2">Play some games to see your match history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        // Find user's participant to determine win/loss
        const userParticipant = match.participants.find((p: MatchParticipant) => 
          p.summonerName === userSummonerName || match.participants.indexOf(p) === 0
        );
        const userWon = userParticipant?.win || false;

        return (
          <div
            key={match.matchId}
            onClick={() => onSelectMatch(match)}
            className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-5 hover:border-blue-500/50 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white mb-1">{match.gameMode}</div>
                <div className="text-sm text-[#78828C]">
                  {new Date(match.gameCreation).toLocaleDateString()} • {new Date(match.gameCreation).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-lg ${userWon ? 'text-blue-400' : 'text-red-400'}`}>
                  {userWon ? 'Victory' : 'Defeat'}
                </div>
                <div className="text-sm text-[#78828C]">
                  {Math.floor(match.gameDuration / 60)}:{(match.gameDuration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchDetailView({ 
  match, 
  activeTab, 
  setActiveTab,
  onBack 
}: { 
  match: Match; 
  activeTab: string;
  setActiveTab: (tab: 'overview' | 'team-analysis') => void;
  onBack: () => void;
}) {
  const blueTeam = match.participants.filter(p => p.teamId === 100);
  const redTeam = match.participants.filter(p => p.teamId === 200);
  const blueTeamData = match.teams.find(t => t.teamId === 100);
  const redTeamData = match.teams.find(t => t.teamId === 200);

  const blueWon = blueTeamData?.win || false;
  const redWon = redTeamData?.win || false;

  const totalKills = (team: MatchParticipant[]) => 
    team.reduce((sum, p) => sum + p.kills, 0);
  
  const totalGold = (team: MatchParticipant[]) => 
    team.reduce((sum, p) => sum + p.goldEarned, 0);

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-blue-400 hover:text-blue-300 flex items-center gap-2 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Match History
      </button>

      {/* Tabs */}
      <div className="border-b border-[#283D4D] mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-[#78828C] hover:text-[#B4BEC8]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('team-analysis')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'team-analysis'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-[#78828C] hover:text-[#B4BEC8]'
            }`}
          >
            Team Analysis
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          blueTeam={blueTeam}
          redTeam={redTeam}
          blueTeamData={blueTeamData}
          redTeamData={redTeamData}
          blueWon={blueWon}
          redWon={redWon}
          totalKills={totalKills}
          totalGold={totalGold}
          gameDuration={match.gameDuration}
        />
      )}

      {activeTab === 'team-analysis' && (
        <TeamAnalysisTab
          blueTeam={blueTeam}
          redTeam={redTeam}
          blueTeamData={blueTeamData}
          redTeamData={redTeamData}
        />
      )}
    </div>
  );
}

function OverviewTab({
  blueTeam,
  redTeam,
  blueTeamData,
  redTeamData,
  blueWon,
  redWon,
  totalKills,
  totalGold,
  gameDuration,
}: any) {
  // Calculate OP Scores for all players
  const allPlayers = [...blueTeam, ...redTeam];
  const allScores = allPlayers.map((p: MatchParticipant) => 
    calculateOPScore({
      ...p,
      gameDuration,
    })
  );

  return (
    <div className="space-y-6">
      {/* Blue Team */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className={`${blueWon ? 'bg-blue-600' : 'bg-gray-600'} text-white px-4 py-2 font-semibold flex justify-between`}>
          <span>{blueWon ? 'Victory' : 'Defeat'} (Blue Team)</span>
          <span>Total Kill: {totalKills(blueTeam)} | Total Gold: {totalGold(blueTeam).toLocaleString()}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium">Player</th>
                <th className="px-4 py-2 text-center text-xs font-medium">OP Score</th>
                <th className="px-4 py-2 text-center text-xs font-medium">KDA</th>
                <th className="px-4 py-2 text-center text-xs font-medium">Damage</th>
                <th className="px-4 py-2 text-center text-xs font-medium">Wards</th>
                <th className="px-4 py-2 text-center text-xs font-medium">CS</th>
                <th className="px-4 py-2 text-center text-xs font-medium">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {blueTeam.map((player: MatchParticipant, idx: number) => {
                const score = calculateOPScore({ ...player, gameDuration });
                return (
                  <PlayerRow 
                    key={idx} 
                    player={player} 
                    opScore={score}
                    opScoreRank={getOPScoreRank(score, allScores)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Red Team */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className={`${redWon ? 'bg-red-600' : 'bg-gray-600'} text-white px-4 py-2 font-semibold flex justify-between`}>
          <span>{redWon ? 'Victory' : 'Defeat'} (Red Team)</span>
          <span>Total Kill: {totalKills(redTeam)} | Total Gold: {totalGold(redTeam).toLocaleString()}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium">Player</th>
                <th className="px-4 py-2 text-center text-xs font-medium">OP Score</th>
                <th className="px-4 py-2 text-center text-xs font-medium">KDA</th>
                <th className="px-4 py-2 text-center text-xs font-medium">Damage</th>
                <th className="px-4 py-2 text-center text-xs font-medium">Wards</th>
                <th className="px-4 py-2 text-center text-xs font-medium">CS</th>
                <th className="px-4 py-2 text-center text-xs font-medium">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {redTeam.map((player: MatchParticipant, idx: number) => {
                const score = calculateOPScore({ ...player, gameDuration });
                return (
                  <PlayerRow 
                    key={idx} 
                    player={player} 
                    opScore={score}
                    opScoreRank={getOPScoreRank(score, allScores)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ 
  player, 
  opScore, 
  opScoreRank 
}: { 
  player: MatchParticipant; 
  opScore?: number;
  opScoreRank?: string;
}) {
  const kda = `${player.kills}/${player.deaths}/${player.assists}`;
  const kdaRatio = player.deaths > 0 
    ? ((player.kills + player.assists) / player.deaths).toFixed(2)
    : (player.kills + player.assists).toFixed(2);
  
  const csPerMin = player.totalMinionsKilled > 0 
    ? (player.totalMinionsKilled / 20).toFixed(1) 
    : '0.0';

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded border border-gray-400 overflow-hidden">
              <img
                src={getChampionImageUrl(player.championId)}
                alt={getChampionName(player.championId)}
                className="w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            {player.individualPosition && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-1 rounded">
                {player.individualPosition.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">{player.summonerName}</div>
            <div className="text-xs text-gray-500">
              Level {player.level} • {player.rank || 'Unranked'} • {getChampionName(player.championId)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="font-semibold">{opScore?.toFixed(1) || 'N/A'}</div>
        <div className="text-xs text-gray-500">({opScoreRank || 'N/A'})</div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="font-medium">{kda}</div>
        <div className="text-xs text-gray-500">{kdaRatio}:1</div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="font-medium">{player.damageDealtToChampions.toLocaleString()}</div>
        <div className="text-xs text-gray-500">
          {player.totalDamageDealt.toLocaleString()} total
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div>{player.wardsPlaced}</div>
        <div className="text-xs text-gray-500">
          {player.controlWardsPlaced}/{player.controlWardsPlaced} control
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="font-medium">{player.totalMinionsKilled}</div>
        <div className="text-xs text-gray-500">{csPerMin}/m</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {player.items.slice(0, 6).map((itemId, idx) => (
            <div
              key={idx}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded border border-gray-400"
              title={`Item ${itemId}`}
            ></div>
          ))}
        </div>
      </td>
    </tr>
  );
}

function TeamAnalysisTab({
  blueTeam,
  redTeam,
  blueTeamData,
  redTeamData,
}: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Team Statistics</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Blue Team Stats */}
        <div>
          <h3 className="font-semibold mb-3 text-blue-600">Blue Team</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Dragon Kills:</span>
              <span>{blueTeamData?.objectives.dragon.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Baron Kills:</span>
              <span>{blueTeamData?.objectives.baron.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Herald Kills:</span>
              <span>{blueTeamData?.objectives.riftHerald.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Tower Kills:</span>
              <span>{blueTeamData?.objectives.tower.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Inhibitor Kills:</span>
              <span>{blueTeamData?.objectives.inhibitor.kills || 0}</span>
            </div>
          </div>
        </div>

        {/* Red Team Stats */}
        <div>
          <h3 className="font-semibold mb-3 text-red-600">Red Team</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Dragon Kills:</span>
              <span>{redTeamData?.objectives.dragon.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Baron Kills:</span>
              <span>{redTeamData?.objectives.baron.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Herald Kills:</span>
              <span>{redTeamData?.objectives.riftHerald.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Tower Kills:</span>
              <span>{redTeamData?.objectives.tower.kills || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Inhibitor Kills:</span>
              <span>{redTeamData?.objectives.inhibitor.kills || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
