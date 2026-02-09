import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
// @ts-ignore - RxJS type conflicts in monorepo
import { map } from 'rxjs/operators';

/**
 * Interceptor to convert BigInt values to numbers before JSON serialization
 * This prevents "Do not know how to serialize a BigInt" errors
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  // @ts-ignore - RxJS type conflicts in monorepo
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    // @ts-ignore - RxJS type conflicts in monorepo
    const result = next.handle().pipe(
      // @ts-ignore - RxJS type conflicts in monorepo
      map((data: any) => this.convertBigInt(data))
    );
    // Use unknown first to bypass duplicate RxJS type conflicts
    return result as unknown as Observable<any>;
  }

  /**
   * Recursively convert BigInt values to numbers
   */
  private convertBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Convert BigInt to number
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigInt(item));
    }
    
    // Handle plain objects (but not Date, RegExp, etc.)
    if (typeof obj === 'object' && obj.constructor === Object) {
      const converted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          converted[key] = this.convertBigInt(obj[key]);
        }
      }
      return converted;
    }
    
    // Return primitives and other objects as-is
    return obj;
  }
}
