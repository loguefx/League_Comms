-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RiotAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "encryptedTokens" TEXT NOT NULL,
    "tokenExpiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RiotAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoiceRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomKey" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VoiceRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "autoJoinVoice" BOOLEAN NOT NULL DEFAULT true,
    "pttKey" TEXT,
    "privacyFlags" TEXT NOT NULL,
    "uiPrefs" TEXT NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "patch" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "championId" INTEGER NOT NULL,
    "role" TEXT,
    "rankTier" TEXT,
    "rankDivision" TEXT,
    "teamId" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL,
    CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChampionRankAgg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rankTier" TEXT NOT NULL,
    "championId" INTEGER NOT NULL,
    "role" TEXT,
    "patch" TEXT NOT NULL,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RiotAccount_userId_key" ON "RiotAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RiotAccount_puuid_key" ON "RiotAccount"("puuid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceRoom_roomKey_key" ON "VoiceRoom"("roomKey");

-- CreateIndex
CREATE INDEX "VoiceRoom_roomKey_idx" ON "VoiceRoom"("roomKey");

-- CreateIndex
CREATE INDEX "VoiceRoom_expiresAt_idx" ON "VoiceRoom"("expiresAt");

-- CreateIndex
CREATE INDEX "RoomMember_roomId_idx" ON "RoomMember"("roomId");

-- CreateIndex
CREATE INDEX "RoomMember_userId_idx" ON "RoomMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_matchId_key" ON "Match"("matchId");

-- CreateIndex
CREATE INDEX "Match_matchId_idx" ON "Match"("matchId");

-- CreateIndex
CREATE INDEX "Match_region_patch_idx" ON "Match"("region", "patch");

-- CreateIndex
CREATE INDEX "MatchParticipant_matchId_idx" ON "MatchParticipant"("matchId");

-- CreateIndex
CREATE INDEX "MatchParticipant_puuid_idx" ON "MatchParticipant"("puuid");

-- CreateIndex
CREATE INDEX "MatchParticipant_championId_rankTier_role_idx" ON "MatchParticipant"("championId", "rankTier", "role");

-- CreateIndex
CREATE INDEX "ChampionRankAgg_rankTier_role_patch_idx" ON "ChampionRankAgg"("rankTier", "role", "patch");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionRankAgg_rankTier_championId_role_patch_key" ON "ChampionRankAgg"("rankTier", "championId", "role", "patch");
