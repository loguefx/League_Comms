import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessToken } from 'livekit-server-sdk';
import { VOICE_ROOM_EXPIRY_MS } from '@league-voice/shared';

@Injectable()
export class VoiceService {
  constructor(
    private prisma: PrismaService,
    @Inject('LIVEKIT_CONFIG') private livekitConfig: { apiKey: string; apiSecret: string; url: string }
  ) {}

  /**
   * Get or create voice room for a game
   */
  async getOrCreateRoom(roomKey: string, gameId: string, teamId: string, region: string) {
    let room = await this.prisma.voiceRoom.findUnique({
      where: { roomKey },
    });

    if (!room) {
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + VOICE_ROOM_EXPIRY_MS);

      room = await this.prisma.voiceRoom.create({
        data: {
          roomKey,
          gameId,
          teamId,
          region,
          expiresAt,
        },
      });
    }

    return room;
  }

  /**
   * Generate LiveKit join token for a user
   */
  async generateJoinToken(userId: string, roomKey: string): Promise<string> {
    // Verify user is in the room's game
    const room = await this.prisma.voiceRoom.findUnique({
      where: { roomKey },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Voice room not found');
    }

    // Create or update room member
    const existingMember = room.members[0];
    if (!existingMember) {
      await this.prisma.roomMember.create({
        data: {
          roomId: room.id,
          userId,
        },
      });
    } else if (existingMember.leftAt) {
      // Rejoin
      await this.prisma.roomMember.update({
        where: { id: existingMember.id },
        data: {
          leftAt: null,
        },
      });
    }

    // Generate LiveKit token
    const at = new AccessToken(this.livekitConfig.apiKey, this.livekitConfig.apiSecret, {
      identity: userId,
      name: userId, // Could be enhanced with user's Riot ID
    });

    at.addGrant({
      room: roomKey,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return at.toJwt();
  }

  /**
   * Leave voice room
   */
  async leaveRoom(userId: string, roomKey: string): Promise<void> {
    const room = await this.prisma.voiceRoom.findUnique({
      where: { roomKey },
      include: {
        members: {
          where: { userId, leftAt: null },
        },
      },
    });

    if (room && room.members.length > 0) {
      await this.prisma.roomMember.update({
        where: { id: room.members[0].id },
        data: {
          leftAt: new Date(),
        },
      });
    }
  }

  /**
   * Get room members
   */
  async getRoomMembers(roomKey: string) {
    const room = await this.prisma.voiceRoom.findUnique({
      where: { roomKey },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              include: {
                riotAccount: true,
              },
            },
          },
        },
      },
    });

    return room?.members || [];
  }
}
