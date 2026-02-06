import type { Region } from '../types';
export declare const RIOT_REGIONS: Record<string, Region>;
export declare const RANK_TIER_GROUPS: {
    readonly EMERALD_PLUS: readonly ["EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
    readonly PLATINUM_PLUS: readonly ["PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
    readonly DIAMOND_PLUS: readonly ["DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
};
export declare const TEAM_IDS: {
    readonly BLUE: "100";
    readonly RED: "200";
};
export declare const GAME_DURATION_ESTIMATE_MS: number;
export declare const ACTIVE_GAME_POLL_INTERVAL_MS: number;
export declare const MATCH_HISTORY_CACHE_TTL_MS: number;
export declare const RIOT_RATE_LIMITS: {
    readonly DEVELOPMENT: {
        readonly requestsPerSecond: 20;
        readonly requestsPerMinute: 100;
    };
    readonly PRODUCTION: {
        readonly requestsPerSecond: 20;
        readonly requestsPerMinute: 100;
    };
};
export declare const VOICE_ROOM_EXPIRY_MS: number;
//# sourceMappingURL=index.d.ts.map