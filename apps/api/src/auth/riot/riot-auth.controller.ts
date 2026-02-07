import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
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
    @Query('error_description') errorDescription: string,
    @Request() req: FastifyRequest,
    @Res() res: FastifyReply
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Log full callback for debugging
    console.log('=== OAuth Callback Received ===');
    console.log('Full URL:', req.url);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('Has code:', !!code);
    console.log('Has error:', !!error);
    if (error) {
      console.log('Error:', error);
      console.log('Error description:', errorDescription);
    }
    console.log('==============================');

    // Handle OAuth errors from Riot
    if (error) {
      console.error('❌ Riot OAuth error:', error);
      console.error('Error description:', errorDescription || 'No description');
      const errorMsg = errorDescription || error;
      return res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(`Riot OAuth error: ${errorMsg}`)}`,
        302
      );
    }

    // Handle missing authorization code
    if (!code) {
      console.error('❌ Missing authorization code in callback');
      console.error('This usually means:');
      console.error('  1. Redirect URI not registered in Riot Developer Portal');
      console.error('  2. Redirect URI mismatch (check for typos, trailing slashes)');
      console.error('  3. Riot rejected the request silently');
      console.error('');
      console.error('Current redirect URI:', process.env.RIOT_REDIRECT_URI);
      console.error('Make sure this EXACT URI is registered in Riot Developer Portal');
      
      return res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent('Missing authorization code. The redirect URI may not be registered in Riot Developer Portal.')}`,
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
