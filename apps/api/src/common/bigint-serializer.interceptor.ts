import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
// @ts-ignore - RxJS type conflicts in monorepo
import { map } from 'rxjs/operators';

/**
 * Interceptor to convert BigInt values to numbers before JSON serialization
 * This prevents "Do not know how to serialize a BigInt" errors
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BigIntSerializerInterceptor.name);

  // @ts-ignore - RxJS type conflicts in monorepo
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    // @ts-ignore - RxJS type conflicts in monorepo
    const result = next.handle().pipe(
      // @ts-ignore - RxJS type conflicts in monorepo
      map((data: any) => {
        try {
          const converted = this.convertBigInt(data);
          // Test serialization to catch any remaining BigInt values
          JSON.stringify(converted);
          return converted;
        } catch (error: any) {
          this.logger.error(`Failed to serialize response for ${request.method} ${request.url}:`, error.message);
          this.logger.error(`Response data type:`, typeof data);
          this.logger.error(`Response data keys:`, data && typeof data === 'object' ? Object.keys(data) : 'N/A');
          throw error;
        }
      })
    );
    // Use unknown first to bypass duplicate RxJS type conflicts
    return result as unknown as Observable<any>;
  }

  /**
   * Recursively convert BigInt values to numbers
   */
  private convertBigInt(obj: any, path: string = 'root'): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Convert BigInt to number
    if (typeof obj === 'bigint') {
      this.logger.warn(`Found BigInt at path: ${path}, converting to number`);
      return Number(obj);
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item, index) => this.convertBigInt(item, `${path}[${index}]`));
    }
    
    // Handle plain objects (but not Date, RegExp, etc.)
    if (typeof obj === 'object' && obj.constructor === Object) {
      const converted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          converted[key] = this.convertBigInt(obj[key], `${path}.${key}`);
        }
      }
      return converted;
    }
    
    // Return primitives and other objects as-is
    return obj;
  }
}
