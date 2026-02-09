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
    console.log(`⏳ Step 1: About to call app.init()...`);
    
    // Explicitly initialize the app (this sets up routes, modules, etc.)
    console.log(`⏳ Step 2: Calling app.init()...`);
    
    // Add timeout to app.init() to catch if it hangs
    await Promise.race([
      app.init(),
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          console.error(`❌ app.init() timed out after 15 seconds`);
          reject(new Error('app.init() timed out after 15 seconds'));
        }, 15000);
      }),
    ]);
    
    console.log(`✅ Step 3: NestJS application initialized`);
    
    // Wait a moment for all async initialization to complete
    console.log(`⏳ Step 4: Waiting 1 second for async initialization...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`✅ Step 5: Wait complete`);
    
    // Get the Fastify instance and start it manually
    console.log(`⏳ Step 6: Getting Fastify instance...`);
    const fastifyInstance = app.getHttpAdapter().getInstance();
    console.log(`✅ Step 7: Got Fastify instance, type: ${typeof fastifyInstance}`);
    console.log(`   Fastify instance has 'listen' method: ${typeof fastifyInstance.listen === 'function'}`);
    console.log(`   Fastify instance has 'server' property: ${!!fastifyInstance.server}`);
    
    // Start Fastify server
    console.log(`⏳ Step 8: Starting Fastify server on port ${port}...`);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error(`❌ Step 8 FAILED: Fastify listen() timed out after 10 seconds`);
        console.error(`   Fastify instance ready state: ${fastifyInstance.server?.listening ? 'listening' : 'not listening'}`);
        console.error(`   Fastify instance server exists: ${!!fastifyInstance.server}`);
        reject(new Error('Fastify listen() timed out after 10 seconds'));
      }, 10000);
      
      console.log(`⏳ Step 8a: Calling fastifyInstance.listen({ port: ${port}, host: '0.0.0.0' })...`);
      try {
        fastifyInstance.listen({ port, host: '0.0.0.0' }, (err: any) => {
          clearTimeout(timeout);
          if (err) {
            console.error(`❌ Step 8b FAILED: Fastify listen() error:`, err);
            console.error(`   Error message: ${err.message}`);
            console.error(`   Error code: ${err.code}`);
            reject(err);
          } else {
            console.log(`✅ Step 8b: Fastify listen() callback executed successfully`);
            resolve();
          }
        });
        console.log(`✅ Step 8a: fastifyInstance.listen() called (callback pending)`);
      } catch (listenError) {
        clearTimeout(timeout);
        console.error(`❌ Step 8a FAILED: Exception calling fastifyInstance.listen():`, listenError);
        reject(listenError);
      }
    });
    
    console.log(`✅ Step 9: Server listen() completed`);
    
    // Verify server is listening
    console.log(`⏳ Step 10: Verifying server is listening...`);
    const httpServer = app.getHttpServer();
    console.log(`✅ Step 11: Got HTTP server instance`);
    
    const address = httpServer.address();
    console.log(`✅ Step 12: Got address:`, address);
    
    if (address) {
      console.log(`✅ Step 13: Server is confirmed listening on:`, address);
      console.log(`🚀 API server running on http://localhost:${port}`);
      console.log(`🌐 API server accessible on http://0.0.0.0:${port}`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`📡 Champions: http://localhost:${port}/champions`);
      console.log(`📡 Patches: http://localhost:${port}/champions/patches`);
      console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
      console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
      console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
    } else {
      console.warn(`⚠️  Step 13 WARNING: httpServer.address() returned null`);
      console.warn(`   This might mean the server isn't actually listening`);
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
