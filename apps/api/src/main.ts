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
    
    // Don't call app.init() explicitly - it's hanging
    // Instead, use app.listen() which handles initialization internally
    // But we need to wait a bit for routes to finish mapping first
    console.log(`⏳ Waiting for route mapping to complete...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✅ Route mapping should be complete`);
    
    // Use app.listen() with a timeout
    console.log(`⏳ Calling app.listen(${port}, '0.0.0.0')...`);
    console.log(`   This will initialize the app and start the server`);
    
    await Promise.race([
      app.listen(port, '0.0.0.0'),
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          console.error(`❌ app.listen() timed out after 20 seconds`);
          console.error(`   This might mean Fastify is waiting for something`);
          reject(new Error('app.listen() timed out after 20 seconds'));
        }, 20000);
      }),
    ]);
    
    console.log(`✅ app.listen() completed successfully`);
    
    // Verify server is listening
    console.log(`⏳ Verifying server is listening...`);
    const httpServer = app.getHttpServer();
    const address = httpServer.address();
    
    if (address) {
      console.log(`✅ Server is confirmed listening on:`, address);
      console.log(`🚀 API server running on http://localhost:${port}`);
      console.log(`🌐 API server accessible on http://0.0.0.0:${port}`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`📡 Champions: http://localhost:${port}/champions`);
      console.log(`📡 Patches: http://localhost:${port}/champions/patches`);
      console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
      console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
      console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
    } else {
      console.warn(`⚠️  httpServer.address() returned null`);
      console.warn(`   But app.listen() completed, so server should be running`);
      console.log(`🚀 API server should be running on http://localhost:${port}`);
      console.log(`📡 Test with: curl http://localhost:${port}/health`);
    }
    
    console.log(`✅✅✅ SERVER STARTUP COMPLETE ✅✅✅`);
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
