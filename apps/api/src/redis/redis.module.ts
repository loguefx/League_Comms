import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { MemoryRedisService } from './memory-redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const useRedis = configService.get('USE_REDIS', 'false') !== 'false';
        
        if (!useRedis) {
          return null;
        }

        try {
          const client = new Redis({
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
            retryStrategy: () => null,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
          });
          
          // Test connection
          client.ping().catch(() => {
            console.warn('Redis connection failed, will use in-memory fallback');
          });
          
          return client;
        } catch (error) {
          console.warn('Redis initialization failed, using in-memory fallback');
          return null;
        }
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
