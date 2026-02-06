"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOICE_ROOM_EXPIRY_MS = exports.RIOT_RATE_LIMITS = exports.MATCH_HISTORY_CACHE_TTL_MS = exports.ACTIVE_GAME_POLL_INTERVAL_MS = exports.GAME_DURATION_ESTIMATE_MS = exports.TEAM_IDS = exports.RANK_TIER_GROUPS = exports.RIOT_REGIONS = void 0;
// Riot API Regions
exports.RIOT_REGIONS = {
    NA: 'na1',
    EUW: 'euw1',
    EUNE: 'eun1',
    KR: 'kr',
    BR: 'br1',
    LAN: 'la1',
    LAS: 'la2',
    OCE: 'oc1',
    RU: 'ru',
    TR: 'tr1',
    JP: 'jp1',
};
// Rank tier groupings for analytics
exports.RANK_TIER_GROUPS = {
    EMERALD_PLUS: ['EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
    PLATINUM_PLUS: ['PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
    DIAMOND_PLUS: ['DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
};
// Team IDs
exports.TEAM_IDS = {
    BLUE: '100',
    RED: '200',
};
// Game constants
exports.GAME_DURATION_ESTIMATE_MS = 30 * 60 * 1000; // 30 minutes
exports.ACTIVE_GAME_POLL_INTERVAL_MS = 12 * 1000; // 12 seconds
exports.MATCH_HISTORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// Riot API Rate Limits (approximate, adjust based on actual limits)
exports.RIOT_RATE_LIMITS = {
    DEVELOPMENT: {
        requestsPerSecond: 20,
        requestsPerMinute: 100,
    },
    PRODUCTION: {
        requestsPerSecond: 20,
        requestsPerMinute: 100,
    },
};
// Voice room expiry (match duration + buffer)
exports.VOICE_ROOM_EXPIRY_MS = exports.GAME_DURATION_ESTIMATE_MS + 5 * 60 * 1000; // 35 minutes
//# sourceMappingURL=index.js.map