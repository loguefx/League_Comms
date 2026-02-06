import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';

@Injectable()
export class RiotRateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RiotRateLimitInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    const result = next.handle().pipe(
      catchError((error) => {
        // Check if it's a Riot API rate limit error
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 1;
          this.logger.warn(`Riot API rate limit hit, retrying after ${retryAfter}s`);
          
          return next.handle().pipe(
            delay(retryAfter * 1000),
            retry(3)
          );
        }

        return throwError(() => error);
      })
    );
    // Use unknown first to bypass duplicate RxJS type conflicts
    return result as unknown as Observable<any>;
  }
}
