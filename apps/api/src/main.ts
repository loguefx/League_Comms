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
  // In development, allow all origins. In production, use ALLOWED_ORIGINS env var
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : process.env.NODE_ENV === 'production'
    ? ['http://localhost:3000']
    : true; // Allow all origins in development

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
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
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API server running on http://localhost:${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Config test: http://localhost:${port}/auth/riot/test/config`);
  console.log(`🔑 API key test: http://localhost:${port}/auth/riot/test/api-key`);
  console.log(`🔐 OAuth start: http://localhost:${port}/auth/riot/start`);
}

bootstrap();
