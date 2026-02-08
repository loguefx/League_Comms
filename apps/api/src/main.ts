import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { RiotRateLimitInterceptor } from './common/riot-rate-limit.interceptor';

async function bootstrap() {
  // @ts-ignore - FastifyAdapter type conflicts with NestJS CORS types
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter() as any
  ) as any;

  // Enable CORS for web and desktop clients
  // In development, always allow all origins (for IP addresses, localhost, etc.)
  // In production, use ALLOWED_ORIGINS env var
  let corsOrigin: boolean | string[] = true; // Default: allow all in development
  
  if (process.env.NODE_ENV === 'production') {
    // Production: use ALLOWED_ORIGINS if set, otherwise default to localhost
    corsOrigin = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'];
  } else {
    // Development: always allow all origins (handles IP addresses, localhost, etc.)
    corsOrigin = true;
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  } as any);

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe (relaxed for development)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Don't block requests with extra fields
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global interceptors
  app.useGlobalInterceptors(new RiotRateLimitInterceptor() as any);

  const port = process.env.PORT || 4000;
  
  try {
    console.log(`⏳ Starting API server on port ${port}...`);
    
    // Get the Fastify instance directly
    const httpServer = app.getHttpServer();
    
    // DEBUG: Log what httpServer actually is
    console.log(`[DEBUG] httpServer type:`, typeof httpServer);
    console.log(`[DEBUG] httpServer constructor:`, httpServer?.constructor?.name);
    console.log(`[DEBUG] httpServer has ready?:`, typeof httpServer?.ready === 'function');
    console.log(`[DEBUG] httpServer has listen?:`, typeof httpServer?.listen === 'function');
    console.log(`[DEBUG] httpServer keys:`, Object.keys(httpServer || {}).slice(0, 20));
    console.log(`[DEBUG] httpServer methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(httpServer || {})).slice(0, 20));
    
    // Try different approaches based on what httpServer is
    if (typeof httpServer?.ready === 'function') {
      // Fastify instance - use ready() then listen()
      console.log(`⏳ Waiting for Fastify to be ready...`);
      await httpServer.ready();
      console.log(`✓ Fastify is ready`);
      
      console.log(`⏳ Starting to listen on port ${port}...`);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Fastify listen() timed out after 10 seconds`));
        }, 10000);
        
        httpServer.listen({ port, host: '0.0.0.0' }, (err?: Error) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } else if (typeof httpServer?.listen === 'function') {
      // Node.js HTTP server - listen directly
      console.log(`⏳ httpServer appears to be a Node.js HTTP server, listening directly...`);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`HTTP server listen() timed out after 10 seconds`));
        }, 10000);
        
        httpServer.listen(port, '0.0.0.0', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        httpServer.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } else {
      // Fallback: try app.listen() but with better error handling
      console.log(`⏳ httpServer doesn't have expected methods, trying app.listen()...`);
      console.log(`[DEBUG] app type:`, typeof app);
      console.log(`[DEBUG] app has listen?:`, typeof app?.listen === 'function');
      
      await app.listen(port, '0.0.0.0');
    }
    
    console.log(`✅ Server listen() completed`);
    
    // Verify server is actually listening
    const finalHttpServer = app.getHttpServer();
    const address = finalHttpServer?.address ? finalHttpServer.address() : null;
    
    if (address) {
      console.log(`✅ Server is listening on:`, address);
      console.log(`🚀 API server running on http://localhost:${port}`);
      console.log(`🌐 API server accessible on http://0.0.0.0:${port}`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
      console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
      console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
    } else {
      // Even if address() is null, the server might be working
      console.warn(`⚠️  httpServer.address() returned null, but server should be listening`);
      console.log(`🚀 API server should be running on http://localhost:${port}`);
      console.log(`📡 Test with: curl http://localhost:${port}/health`);
    }
  } catch (error) {
    console.error('❌ Failed to start API server:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Additional debugging
    console.error('[DEBUG] Final error details:');
    try {
      const httpServer = app.getHttpServer();
      console.error('[DEBUG] httpServer after error:', {
        type: typeof httpServer,
        constructor: httpServer?.constructor?.name,
        hasListen: typeof httpServer?.listen === 'function',
        hasReady: typeof httpServer?.ready === 'function',
      });
    } catch (debugError) {
      console.error('[DEBUG] Could not get httpServer for debugging:', debugError);
    }
    
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to bootstrap application:', error);
  process.exit(1);
});
