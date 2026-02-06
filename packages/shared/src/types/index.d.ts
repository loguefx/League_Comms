export type Region = 'na1' | 'euw1' | 'eun1' | 'kr' | 'br1' | 'la1' | 'la2' | 'oc1' | 'ru' | 'tr1' | 'jp1';
export type RankTier = 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';
export type RankDivision = 'I' | 'II' | 'III' | 'IV';
export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
export interface RiotID {
    gameName: string;
    tagLine: string;
}
export interface PUUID {
    puuid: string;
}
export interface User {
    id: string;
    email?: string;
    createdAt: Date;
}
export interface RiotAccount {
    id: string;
    userId: string;
    puuid: string;
    gameName: string;
    tagLine: string;
    region: Region;
    tokenExpiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface VoiceRoom {
    id: string;
    roomKey: string;
    gameId: string;
    teamId: string;
    region: Region;
    expiresAt: Date;
    createdAt: Date;
}
export interface RoomMember {
    id: string;
    roomId: string;
    userId: string;
    joinedAt: Date;
    leftAt?: Date;
}
export interface ActiveGame {
    gameId: string;
    gameType: string;
    gameStartTime: number;
    mapId: number;
    platformId: string;
    gameMode: string;
    gameQueueConfigId: number;
    participants: GameParticipant[];
}
export interface GameParticipant {
    teamId: number;
    spell1Id: number;
    spell2Id: number;
    championId: number;
    profileIconId: number;
    summonerName: string;
    bot: boolean;
    summonerId: string;
    gameCustomizationObjects: unknown[];
}
export interface PlayerStats {
    puuid: string;
    wins: number;
    losses: number;
    totalGames: number;
    winRate: number;
    last20Wins: number;
    last20Losses: number;
    last20WinRate: number;
    mainRole: Role | null;
    topChampions: ChampionPlay[];
}
export interface ChampionPlay {
    championId: number;
    games: number;
    wins: number;
    losses: number;
    winRate: number;
}
export interface ChampionRankStats {
    championId: number;
    rankTier: string;
    role: Role | null;
    patch: string;
    matches: number;
    wins: number;
    winRate: number;
    pickRate: number;
}
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface UserSettings {
    id: string;
    userId: string;
    autoJoinVoice: boolean;
    pttKey?: string;
    privacyFlags: {
        hideProfile?: boolean;
    };
    uiPrefs: {
        theme?: 'light' | 'dark';
    };
}
//# sourceMappingURL=index.d.ts.map