"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsQuerySchema = exports.userSettingsSchema = exports.roomKeySchema = exports.puuidSchema = exports.riotIdSchema = exports.roleSchema = exports.rankDivisionSchema = exports.rankTierSchema = exports.regionSchema = void 0;
const zod_1 = require("zod");
// Region validation
exports.regionSchema = zod_1.z.enum([
    'na1',
    'euw1',
    'eun1',
    'kr',
    'br1',
    'la1',
    'la2',
    'oc1',
    'ru',
    'tr1',
    'jp1',
]);
// Rank validation
exports.rankTierSchema = zod_1.z.enum([
    'IRON',
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'EMERALD',
    'DIAMOND',
    'MASTER',
    'GRANDMASTER',
    'CHALLENGER',
]);
exports.rankDivisionSchema = zod_1.z.enum(['I', 'II', 'III', 'IV']);
exports.roleSchema = zod_1.z.enum(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']);
// Riot ID validation
exports.riotIdSchema = zod_1.z.object({
    gameName: zod_1.z.string().min(1).max(16),
    tagLine: zod_1.z.string().min(1).max(5),
});
// PUUID validation
exports.puuidSchema = zod_1.z.string().uuid();
// Voice room key validation
exports.roomKeySchema = zod_1.z.string().regex(/^[a-z0-9]+:[0-9]+:(100|200)$/);
// User settings validation
exports.userSettingsSchema = zod_1.z.object({
    autoJoinVoice: zod_1.z.boolean().default(true),
    pttKey: zod_1.z.string().optional(),
    privacyFlags: zod_1.z
        .object({
        hideProfile: zod_1.z.boolean().optional(),
    })
        .default({}),
    uiPrefs: zod_1.z
        .object({
        theme: zod_1.z.enum(['light', 'dark']).optional(),
    })
        .default({}),
});
// Analytics query validation
exports.analyticsQuerySchema = zod_1.z.object({
    rank: zod_1.z.string().optional(),
    role: exports.roleSchema.optional(),
    patch: zod_1.z.string().optional(),
});
//# sourceMappingURL=index.js.map