import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

interface GameStartedEvent {
  gameId: string;
  teamId: string;
  region: string;
  roomKey: string;
  phase: 'ban' | 'loading' | 'in-game';
  gameStartTime: number;
  blueTeam: Array<{
    summonerName: string;
    championId: number;
    spell1Id: number;
    spell2Id: number;
    profileIconId: number;
    summonerId: string;
    participantId?: number;
  }>;
  redTeam: Array<{
    summonerName: string;
    championId: number;
    spell1Id: number;
    spell2Id: number;
    profileIconId: number;
    summonerId: string;
    participantId?: number;
  }>;
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

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private authService: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const userId = await this.authService.validateSession(token);
      if (!userId) {
        client.disconnect();
        return;
      }

      this.userSockets.set(userId, client.id);
      client.data.userId = userId;
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  emitGameStarted(userId: string, event: GameStartedEvent) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('GAME_STARTED', event);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
