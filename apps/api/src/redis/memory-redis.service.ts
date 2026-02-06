import { Injectable } from '@nestjs/common';

/**
 * In-memory Redis fallback when Redis is not available
 * Note: This is not persistent and will be lost on restart
 */
@Injectable()
export class MemoryRedisService {
  private cache = new Map<string, { value: string; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const entry: { value: string; expiresAt?: number } = { value: serialized };

    if (ttlSeconds) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }

    this.cache.set(key, entry);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  getClient(): any {
    // Return a mock client that implements basic Redis methods
    return {
      incr: async (key: string) => {
        const current = await this.get<number>(key) || 0;
        await this.set(key, current + 1);
        return current + 1;
      },
      expire: async (key: string, seconds: number) => {
        const entry = this.cache.get(key);
        if (entry) {
          entry.expiresAt = Date.now() + seconds * 1000;
        }
      },
    };
  }
}
