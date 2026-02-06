import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';

@Injectable()
export class RiotRateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RiotRateLimitInterceptor.name);

  // @ts-ignore - Duplicate RxJS type conflicts from node_modules
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    // @ts-ignore
    const result = next.handle().pipe(
      // @ts-ignore
      catchError((error: any) => {
        // Check if it's a Riot API rate limit error
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 1;
          this.logger.warn(`Riot API rate limit hit, retrying after ${retryAfter}s`);
          
          // @ts-ignore
          return next.handle().pipe(
            // @ts-ignore
            delay(retryAfter * 1000),
            // @ts-ignore
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
