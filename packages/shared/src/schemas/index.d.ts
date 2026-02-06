import { z } from 'zod';
export declare const regionSchema: z.ZodEnum<["na1", "euw1", "eun1", "kr", "br1", "la1", "la2", "oc1", "ru", "tr1", "jp1"]>;
export declare const rankTierSchema: z.ZodEnum<["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"]>;
export declare const rankDivisionSchema: z.ZodEnum<["I", "II", "III", "IV"]>;
export declare const roleSchema: z.ZodEnum<["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]>;
export declare const riotIdSchema: z.ZodObject<{
    gameName: z.ZodString;
    tagLine: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gameName: string;
    tagLine: string;
}, {
    gameName: string;
    tagLine: string;
}>;
export declare const puuidSchema: z.ZodString;
export declare const roomKeySchema: z.ZodString;
export declare const userSettingsSchema: z.ZodObject<{
    autoJoinVoice: z.ZodDefault<z.ZodBoolean>;
    pttKey: z.ZodOptional<z.ZodString>;
    privacyFlags: z.ZodDefault<z.ZodObject<{
        hideProfile: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        hideProfile?: boolean | undefined;
    }, {
        hideProfile?: boolean | undefined;
    }>>;
    uiPrefs: z.ZodDefault<z.ZodObject<{
        theme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
    }, "strip", z.ZodTypeAny, {
        theme?: "light" | "dark" | undefined;
    }, {
        theme?: "light" | "dark" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    autoJoinVoice: boolean;
    privacyFlags: {
        hideProfile?: boolean | undefined;
    };
    uiPrefs: {
        theme?: "light" | "dark" | undefined;
    };
    pttKey?: string | undefined;
}, {
    autoJoinVoice?: boolean | undefined;
    pttKey?: string | undefined;
    privacyFlags?: {
        hideProfile?: boolean | undefined;
    } | undefined;
    uiPrefs?: {
        theme?: "light" | "dark" | undefined;
    } | undefined;
}>;
export declare const analyticsQuerySchema: z.ZodObject<{
    rank: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]>>;
    patch: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rank?: string | undefined;
    role?: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | undefined;
    patch?: string | undefined;
}, {
    rank?: string | undefined;
    role?: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | undefined;
    patch?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map