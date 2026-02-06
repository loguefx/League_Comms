import { Controller, Post, Get, UseGuards, Request, Body, Param } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameDetectionService } from '../game/game-detection.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(
    private voiceService: VoiceService,
    private gameDetectionService: GameDetectionService,
    private prisma: PrismaService
  ) {}

  @Post('token')
  async getJoinToken(@Request() req: any, @Body() body: { roomKey?: string }) {
    const userId = req.user.userId;

    // If roomKey provided, use it; otherwise try to get from active game
    let roomKey = body.roomKey;

    if (!roomKey) {
      // Try to get active game room for user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          riotAccount: true,
        },
      });

      if (!user || !user.riotAccount) {
        throw new Error('User not linked to Riot account');
      }

      // This is a simplified version - in production, you'd track active games
      // For now, we'll require roomKey to be provided
      throw new Error('roomKey is required');
    }

    const token = await this.voiceService.generateJoinToken(userId, roomKey);
    return { token, roomKey, url: process.env.LIVEKIT_URL || 'http://localhost:7880' };
  }

  @Post('leave')
  async leaveRoom(@Request() req: any, @Body() body: { roomKey: string }) {
    await this.voiceService.leaveRoom(req.user.userId, body.roomKey);
    return { message: 'Left room' };
  }

  @Get('room/:roomKey/members')
  async getRoomMembers(@Param('roomKey') roomKey: string) {
    const members = await this.voiceService.getRoomMembers(roomKey);
    return { members: members.map((m) => ({ userId: m.userId, riotId: m.user.riotAccount ? `${m.user.riotAccount.gameName}#${m.user.riotAccount.tagLine}` : null })) };
  }
}
