import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';

    // Per-user rate limiting
    if (userId) {
      const userKey = `rate_limit:user:${userId}`;
      const userCount = await this.redis.getClient().incr(userKey);
      if (userCount === 1) {
        await this.redis.getClient().expire(userKey, 60); // 1 minute window
      }
      if (userCount > 100) {
        // 100 requests per minute per user
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    // Per-IP rate limiting
    const ipKey = `rate_limit:ip:${ip}`;
    const ipCount = await this.redis.getClient().incr(ipKey);
    if (ipCount === 1) {
      await this.redis.getClient().expire(ipKey, 60);
    }
    if (ipCount > 200) {
      // 200 requests per minute per IP
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
