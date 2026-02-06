import { Injectable, Inject, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import { MemoryRedisService } from './memory-redis.service';

@Injectable()
export class RedisService {
  private memoryFallback: MemoryRedisService | null = null;

  constructor(
    @Optional() @Inject('REDIS_CLIENT') private readonly redis: Redis | null
  ) {
    if (!this.redis) {
      this.memoryFallback = new MemoryRedisService();
      console.warn('Redis not available, using in-memory fallback (not persistent)');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        return value ? (JSON.parse(value) as T) : null;
      } catch {
        // Fallback to memory if Redis fails
        return this.memoryFallback?.get<T>(key) || null;
      }
    }
    return this.memoryFallback?.get<T>(key) || null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (this.redis) {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
        return;
      } catch {
        // Fallback to memory if Redis fails
      }
    }
    await this.memoryFallback?.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch {
        // Fallback to memory if Redis fails
      }
    }
    await this.memoryFallback?.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.redis) {
      try {
        const result = await this.redis.exists(key);
        return result === 1;
      } catch {
        // Fallback to memory if Redis fails
      }
    }
    return (await this.memoryFallback?.exists(key)) || false;
  }

  getClient(): Redis | any {
    if (this.redis) {
      return this.redis;
    }
    return this.memoryFallback?.getClient() || {};
  }
}
