import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Rate limiter service for Riot API calls
 * Respects rate limits: 20 requests/second, 100 requests/2 minutes
 */
@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  
  // Rate limit configuration from .env
  private readonly enabled: boolean;
  private readonly requestDelay: number; // Delay between individual requests (ms)
  private readonly batchDelay: number; // Delay between batches (ms)
  private readonly retryDelay: number; // Initial delay for 429 retries (ms)
  private readonly maxRetries: number; // Max retries for 429 errors
  
  // Rate limit tracking
  private requestTimestamps: number[] = []; // Track requests for 2-minute window
  private lastRequestTime: number = 0;
  
  constructor(private configService: ConfigService) {
    // Read configuration from .env
    this.enabled = this.configService.get<string>('RIOT_RATE_LIMIT_ENABLED', 'true').toLowerCase() === 'true';
    this.requestDelay = parseInt(this.configService.get<string>('RIOT_REQUEST_DELAY_MS', '100'), 10);
    this.batchDelay = parseInt(this.configService.get<string>('RIOT_BATCH_DELAY_MS', '2000'), 10);
    this.retryDelay = parseInt(this.configService.get<string>('RIOT_RETRY_DELAY_MS', '5000'), 10);
    this.maxRetries = parseInt(this.configService.get<string>('RIOT_MAX_RETRIES', '3'), 10);
    
    if (this.enabled) {
      this.logger.log(`Rate limiting ENABLED: ${this.requestDelay}ms between requests, ${this.batchDelay}ms between batches`);
    } else {
      this.logger.warn('Rate limiting DISABLED - use only with production API keys!');
    }
  }
  
  /**
   * Wait before making a request (respects 20 requests/second limit)
   */
  async waitForRequest(): Promise<void> {
    if (!this.enabled) {
      return; // No delay if rate limiting is disabled
    }
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    
    // Track for 2-minute window (100 requests/2 minutes)
    this.requestTimestamps.push(this.lastRequestTime);
    this.cleanOldTimestamps();
    
    // If we're approaching the 2-minute limit, wait longer
    if (this.requestTimestamps.length >= 90) {
      const oldestRequest = this.requestTimestamps[0];
      const timeUntilOldestExpires = (oldestRequest + 120000) - Date.now();
      if (timeUntilOldestExpires > 0) {
        this.logger.warn(`Approaching 2-minute rate limit (${this.requestTimestamps.length}/100), waiting ${timeUntilOldestExpires}ms`);
        await new Promise(resolve => setTimeout(resolve, timeUntilOldestExpires));
      }
    }
  }
  
  /**
   * Wait between batches
   */
  async waitForBatch(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, this.batchDelay));
  }
  
  /**
   * Handle 429 rate limit errors with exponential backoff
   */
  async handleRateLimitError(attempt: number = 1): Promise<void> {
    if (!this.enabled) {
      return;
    }
    
    if (attempt > this.maxRetries) {
      throw new Error(`Rate limit exceeded after ${this.maxRetries} retries`);
    }
    
    // Exponential backoff: 5s, 10s, 20s, etc.
    const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
    this.logger.warn(`Rate limit hit (429), waiting ${backoffDelay}ms before retry ${attempt}/${this.maxRetries}`);
    
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    // Clear recent timestamps to reset our tracking
    const twoMinutesAgo = Date.now() - 120000;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > twoMinutesAgo);
  }
  
  /**
   * Clean old timestamps (older than 2 minutes)
   */
  private cleanOldTimestamps(): void {
    const twoMinutesAgo = Date.now() - 120000;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > twoMinutesAgo);
  }
  
  /**
   * Check if rate limiting is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
