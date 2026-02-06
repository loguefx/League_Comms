import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { RiotAuthService } from './riot-auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth/riot')
export class RiotAuthController {
  constructor(private riotAuthService: RiotAuthService) {}

  @Get('start')
  async start(@Res() res: FastifyReply, @Query('state') state?: string) {
    const url = await this.riotAuthService.getAuthorizationUrl(state);
    return res.redirect(302, url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: FastifyReply
  ) {
    try {
      const result = await this.riotAuthService.handleCallback(code, state);
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(302, `${frontendUrl}/auth/callback?token=${result.token}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(302, `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: any) {
    return this.riotAuthService.getRiotAccountStatus(req.user.userId);
  }
}
