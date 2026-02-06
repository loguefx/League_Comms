import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { GameDetectionService } from './game-detection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameDetectionService: GameDetectionService) {}

  @Post('start-polling')
  async startPolling(@Request() req: any) {
    await this.gameDetectionService.startPolling(req.user.userId);
    return { message: 'Polling started' };
  }

  @Post('stop-polling')
  async stopPolling(@Request() req: any) {
    await this.gameDetectionService.stopPolling(req.user.userId);
    return { message: 'Polling stopped' };
  }

  @Get('status')
  async getStatus(@Request() req: any) {
    // Return current game status if any
    return { message: 'Status endpoint - to be implemented' };
  }
}
