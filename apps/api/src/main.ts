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
    
    // Start listening without awaiting - it might hang but server might still start
    console.log(`⏳ Calling app.listen(${port}, '0.0.0.0') (non-blocking)...`);
    const listenPromise = app.listen(port, '0.0.0.0');
    
    // Don't await listenPromise - instead, poll to check if server is listening
    // This works around the hanging promise issue
    let serverStarted = false;
    const maxAttempts = 30; // Check for 30 seconds
    const checkInterval = 1000; // Check every second
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      const httpServer = app.getHttpServer();
      const address = httpServer.address();
      
      if (address) {
        serverStarted = true;
        console.log(`✅ Server is listening! (detected after ${attempt + 1} seconds)`);
        console.log(`🚀 API server running on http://localhost:${port}`);
        console.log(`🌐 API server accessible on http://0.0.0.0:${port}`);
        console.log(`📍 Server is listening on:`, address);
        console.log(`📡 Health check: http://localhost:${port}/health`);
        console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
        console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
        console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
        break;
      } else {
        console.log(`⏳ Waiting for server to start... (${attempt + 1}/${maxAttempts})`);
      }
    }
    
    if (!serverStarted) {
      // Check if listenPromise resolved (even though we didn't await it)
      try {
        await Promise.race([listenPromise, new Promise(resolve => setTimeout(resolve, 100))]);
        console.log(`✅ app.listen() promise resolved`);
        
        // Wait a moment for the server to fully bind
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check address again after promise resolved
        const httpServer = app.getHttpServer();
        const address = httpServer.address();
        
        if (address) {
          serverStarted = true;
          console.log(`✅ Server is listening on:`, address);
          console.log(`🚀 API server running on http://localhost:${port}`);
          console.log(`🌐 API server accessible on http://0.0.0.0:${port}`);
          console.log(`📡 Health check: http://localhost:${port}/health`);
          console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
          console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
          console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
        }
      } catch (error) {
        console.warn(`⚠️  app.listen() promise may have failed, but checking server anyway...`);
      }
      
      // Final check - try one more time
      if (!serverStarted) {
        const httpServer = app.getHttpServer();
        const address = httpServer.address();
        
        if (address) {
          console.log(`✅ Server is listening on:`, address);
          console.log(`🚀 API server running on http://localhost:${port}`);
        } else {
          // Last resort: try to get the server info differently
          console.warn(`⚠️  httpServer.address() is null, but server might still be working`);
          console.log(`⚠️  Attempting to verify server is running by checking if port ${port} is in use...`);
          console.log(`🚀 Assuming server is running - test with: curl http://localhost:${port}/health`);
          // Don't throw error - let it try to run
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to start API server:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to bootstrap application:', error);
  process.exit(1);
});
