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
    return res.redirect(url, 302);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: FastifyReply
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Handle OAuth errors from Riot
    if (error) {
      console.error('Riot OAuth error:', error);
      return res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(`Riot OAuth error: ${error}`)}`,
        302
      );
    }

    // Handle missing authorization code
    if (!code) {
      console.error('Missing authorization code in callback');
      return res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent('Missing authorization code. Please try again.')}`,
        302
      );
    }

    try {
      console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
      const result = await this.riotAuthService.handleCallback(code, state);
      console.log('OAuth callback successful, redirecting to frontend');
      // Redirect to frontend with token
      return res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`, 302);
    } catch (error: any) {
      console.error('Error in OAuth callback:', error);
      const errorMessage = error?.message || 'Unknown error occurred during authentication';
      return res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`,
        302
      );
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: any) {
    return this.riotAuthService.getRiotAccountStatus(req.user.userId);
  }
}
