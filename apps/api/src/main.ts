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
    
    // Use Fastify's ready() method to ensure it's initialized
    console.log(`⏳ Waiting for Fastify to be ready...`);
    await httpServer.ready();
    console.log(`✓ Fastify is ready`);
    
    // Now listen directly on the Fastify instance
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
    
    console.log(`✅ Server listen() completed`);
    
    // Verify server is actually listening
    const address = httpServer.address();
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
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to bootstrap application:', error);
  process.exit(1);
});
