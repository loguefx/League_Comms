import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get()
  root() {
    return {
      message: 'League Voice Companion API',
      version: '0.1.0',
      endpoints: {
        health: '/health',
        oauth: {
          start: '/auth/riot/start',
          callback: '/auth/riot/callback',
          status: '/auth/riot/status (protected)',
        },
        test: {
          config: '/auth/riot/test/config',
          apiKey: '/auth/riot/test/api-key',
        },
      },
    };
  }
}
