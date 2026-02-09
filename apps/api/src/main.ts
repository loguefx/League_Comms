import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { RiotRateLimitInterceptor } from './common/riot-rate-limit.interceptor';
import { BigIntSerializerInterceptor } from './common/bigint-serializer.interceptor';

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
  app.useGlobalInterceptors(
    new RiotRateLimitInterceptor() as any,
    new BigIntSerializerInterceptor()
  );

  const port = process.env.PORT || 4000;
  
  try {
    console.log(`⏳ Starting API server on port ${port}...`);
    
    // Wait for routes to be mapped (they're already mapped based on logs)
    console.log(`⏳ Waiting 3 seconds for route mapping and module initialization...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`✅ Wait complete`);
    
    // We need to ensure NestJS has registered routes with Fastify
    // Try calling app.init() with a short timeout - if it works, great; if not, continue anyway
    console.log(`⏳ Attempting to initialize NestJS (with 5 second timeout)...`);
    try {
      await Promise.race([
        app.init(),
        new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 5000);
        }),
      ]);
      console.log(`✅ NestJS initialization completed`);
    } catch (error: any) {
      if (error.message === 'timeout') {
        console.warn(`⚠️  NestJS init() timed out, but continuing anyway (routes may already be registered)`);
      } else {
        console.warn(`⚠️  NestJS init() failed: ${error.message}, but continuing anyway`);
      }
    }
    
    // Get Fastify instance
    console.log(`⏳ Getting Fastify instance...`);
    const fastifyInstance = app.getHttpAdapter().getInstance();
    console.log(`✅ Got Fastify instance`);
    
    // Check if routes are registered
    console.log(`⏳ Checking if routes are registered...`);
    const routes = fastifyInstance.printRoutes();
    console.log(`✅ Fastify routes:`, routes ? 'Registered' : 'Not registered');
    if (routes) {
      console.log(`   Route count: ${routes.split('\n').filter(line => line.trim()).length} routes`);
    }
    
    // Start the server using Fastify's listen directly
    console.log(`⏳ Starting Fastify server directly on port ${port}...`);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error(`❌ Fastify listen() timed out after 15 seconds`);
        reject(new Error('Fastify listen() timed out after 15 seconds'));
      }, 15000);
      
      // Use Fastify's listen method directly
      fastifyInstance.listen({ port, host: '0.0.0.0' }, (err: any) => {
        clearTimeout(timeout);
        if (err) {
          console.error(`❌ Fastify listen() error:`, err);
          reject(err);
        } else {
          console.log(`✅ Fastify server started successfully`);
          resolve();
        }
      });
    });
    
    console.log(`✅ Server startup complete`);
    
    // Verify server is listening
    const httpServer = app.getHttpServer();
    const address = httpServer.address();
    
    if (address) {
      console.log(`✅ Server is confirmed listening on:`, address);
    } else {
      console.warn(`⚠️  httpServer.address() returned null, but server should be listening`);
    }
    
    console.log(`🚀 API server running on http://localhost:${port}`);
    console.log(`🌐 API server accessible on http://0.0.0.0:${port}`);
    console.log(`📡 Health check: http://localhost:${port}/health`);
    console.log(`📡 Champions: http://localhost:${port}/champions`);
    console.log(`📡 Patches: http://localhost:${port}/champions/patches`);
    console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
    console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
    console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
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
