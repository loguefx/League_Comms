import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    // Placeholder - will be implemented with JWT guard
    return { message: 'Auth endpoint - to be implemented' };
  }
}
