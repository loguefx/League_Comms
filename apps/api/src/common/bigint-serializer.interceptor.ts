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
    this.logger.log(`[BigIntSerializerInterceptor] ⚡ Processing ${request.method} ${request.url}`);
    
    // @ts-ignore - RxJS type conflicts in monorepo
    const result = next.handle().pipe(
      // @ts-ignore - RxJS type conflicts in monorepo
      map((data: any) => {
        this.logger.log(`[BigIntSerializerInterceptor] 📦 Received data for ${request.method} ${request.url}, type: ${typeof data}`);
        
        // First, aggressively convert ALL BigInt values
        let converted = this.convertBigIntRecursive(data);
        this.logger.log(`[BigIntSerializerInterceptor] ✅ Converted BigInt values`);
        
        // Then try to serialize with a replacer function as a safety net
        try {
          const testString = JSON.stringify(converted, (key, value) => {
            if (typeof value === 'bigint') {
              this.logger.warn(`[BigIntSerializerInterceptor] ⚠️ Found BigInt at path: ${key} during stringify, converting to number`);
              return Number(value);
            }
            return value;
          });
          this.logger.log(`[BigIntSerializerInterceptor] ✅ Successfully serialized response for ${request.method} ${request.url}`);
          return converted;
        } catch (error: any) {
          this.logger.error(`[BigIntSerializerInterceptor] ❌ Failed to serialize response for ${request.method} ${request.url}`);
          this.logger.error(`[BigIntSerializerInterceptor] Error message: ${error.message}`);
          this.logger.error(`[BigIntSerializerInterceptor] Error stack:`, error.stack);
          this.logger.error(`[BigIntSerializerInterceptor] Response data type: ${typeof data}`);
          this.logger.error(`[BigIntSerializerInterceptor] Response data keys:`, data && typeof data === 'object' ? Object.keys(data) : 'N/A');
          
          // Log a sample of the data to help debug
          try {
            this.logger.error(`[BigIntSerializerInterceptor] Data sample (first 500 chars):`, JSON.stringify(data).substring(0, 500));
          } catch (e) {
            this.logger.error(`[BigIntSerializerInterceptor] Could not stringify data sample`);
          }
          
          // Try one more time with even more aggressive conversion
          try {
            this.logger.log(`[BigIntSerializerInterceptor] 🔄 Attempting retry conversion...`);
            converted = this.convertBigIntRecursive(data);
            // Use a custom serializer that handles BigInt
            const safeString = JSON.stringify(converted, (key, value) => {
              if (typeof value === 'bigint') {
                this.logger.warn(`[BigIntSerializerInterceptor] ⚠️ Found BigInt at path: ${key} during retry, converting to number`);
                return Number(value);
              }
              return value;
            });
            JSON.parse(safeString); // Verify it can be parsed back
            this.logger.warn(`[BigIntSerializerInterceptor] ✅ Retry conversion succeeded for ${request.method} ${request.url}`);
            return converted;
          } catch (retryError: any) {
            this.logger.error(`[BigIntSerializerInterceptor] ❌ Retry conversion also failed`);
            this.logger.error(`[BigIntSerializerInterceptor] Retry error message: ${retryError.message}`);
            this.logger.error(`[BigIntSerializerInterceptor] Retry error stack:`, retryError.stack);
            // Return a safe error response instead of throwing
            return {
              error: 'Failed to serialize response data',
              message: 'Internal server error during data serialization',
            };
          }
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

  /**
   * More aggressive recursive conversion that handles edge cases
   */
  private convertBigIntRecursive(obj: any, depth: number = 0): any {
    // Prevent infinite recursion
    if (depth > 100) {
      this.logger.warn(`[convertBigIntRecursive] Max depth reached, returning as-is`);
      return obj;
    }
    
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'bigint') {
      this.logger.warn(`[convertBigIntRecursive] Found BigInt at depth ${depth}, converting to number`);
      return Number(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => {
        try {
          return this.convertBigIntRecursive(item, depth + 1);
        } catch (e) {
          this.logger.warn(`[convertBigIntRecursive] Error converting array item ${index}:`, e);
          return null;
        }
      });
    }
    
    if (typeof obj === 'object') {
      // Handle all object types, including class instances
      const converted: any = {};
      for (const key in obj) {
        try {
          if (obj.hasOwnProperty(key)) {
            converted[key] = this.convertBigIntRecursive(obj[key], depth + 1);
          }
        } catch (e) {
          // Skip problematic keys but log them
          this.logger.warn(`[convertBigIntRecursive] Skipping key ${key} during BigInt conversion:`, e);
        }
      }
      return converted;
    }
    
    return obj;
  }
}
