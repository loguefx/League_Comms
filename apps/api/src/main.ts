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
    
    // Don't call app.init() explicitly - NestJS handles this automatically
    // app.listen() will call init() internally if needed
    // Calling it explicitly was causing it to hang
    
    console.log(`⏳ Calling app.listen(${port}, '0.0.0.0')...`);
    
    // Use app.listen() - NestJS will handle initialization
    // Add a timeout to detect if it hangs
    const listenPromise = app.listen(port, '0.0.0.0');
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`app.listen() timed out after 30 seconds`));
      }, 30000);
    });
    
    // Race between listen and timeout
    try {
      await Promise.race([listenPromise, timeoutPromise]);
      console.log(`✅ app.listen() promise resolved`);
    } catch (error) {
      // Check if server is actually listening despite timeout
      const httpServer = app.getHttpServer();
      const address = httpServer.address();
      if (address) {
        console.log(`⚠️  app.listen() timed out BUT server IS listening on:`, address);
        console.log(`🚀 Server is actually running despite timeout!`);
      } else {
        console.error(`❌ app.listen() timed out AND server is NOT listening`);
        throw error; // Re-throw if server isn't listening
      }
    }
    
    // Verify server is actually listening
    const httpServer = app.getHttpServer();
    const address = httpServer.address();
    
    if (address) {
      console.log(`✅ Server listen() completed successfully`);
      console.log(`🚀 API server running on http://localhost:${port}`);
      console.log(`🌐 API server accessible on http://0.0.0.0:${port}`);
      console.log(`📍 Server is listening on:`, address);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
      console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
      console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
    } else {
      console.error(`❌ Server address is null - server is NOT listening`);
      throw new Error('Server failed to start listening');
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
