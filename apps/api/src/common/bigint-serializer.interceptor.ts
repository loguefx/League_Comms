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
    // #region agent log
    console.log('[DEBUG] Interceptor entry', { method: request.method, url: request.url });
    fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:15',message:'Interceptor entry',data:{method:request.method,url:request.url},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    this.logger.log(`[BigIntSerializerInterceptor] ⚡ Processing ${request.method} ${request.url}`);
    
    // @ts-ignore - RxJS type conflicts in monorepo
    const result = next.handle().pipe(
      // @ts-ignore - RxJS type conflicts in monorepo
      map((data: any) => {
        // #region agent log
        console.log('[DEBUG] Interceptor received data', { dataType: typeof data, isObject: typeof data === 'object', hasKeys: data && typeof data === 'object' ? Object.keys(data).length : 0 });
        fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:22',message:'Interceptor received data',data:{dataType:typeof data,isObject:typeof data==='object',hasKeys:data&&typeof data==='object'?Object.keys(data).length:0},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        this.logger.log(`[BigIntSerializerInterceptor] 📦 Received data for ${request.method} ${request.url}, type: ${typeof data}`);
        
        // First, aggressively convert ALL BigInt values
        let converted = this.convertBigIntRecursive(data);
        // #region agent log
        console.log('[DEBUG] After convertBigIntRecursive', { convertedType: typeof converted });
        fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:26',message:'After convertBigIntRecursive',data:{convertedType:typeof converted},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        this.logger.log(`[BigIntSerializerInterceptor] ✅ Converted BigInt values`);
        
        // Then try to serialize with a replacer function as a safety net
        try {
          // #region agent log
          console.log('[DEBUG] Before interceptor JSON.stringify', { convertedType: typeof converted });
          fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:30',message:'Before interceptor JSON.stringify',data:{convertedType:typeof converted},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          // Use a more aggressive replacer that handles all edge cases
          const testString = JSON.stringify(converted, (key, value) => {
            if (typeof value === 'bigint') {
              // #region agent log
              console.log('[DEBUG] Found BigInt in interceptor stringify replacer', { key });
              fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:32',message:'Found BigInt in interceptor stringify replacer',data:{key},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              this.logger.warn(`[BigIntSerializerInterceptor] ⚠️ Found BigInt at path: ${key} during stringify, converting to number`);
              return Number(value);
            }
            // Handle invalid numbers
            if (typeof value === 'number' && (value === Infinity || value === -Infinity || isNaN(value))) {
              this.logger.warn(`[BigIntSerializerInterceptor] ⚠️ Found invalid number at path: ${key}, converting to null`);
              return null;
            }
            return value;
          });
          // #region agent log
          console.log('[DEBUG] Interceptor JSON.stringify succeeded', { testStringLength: testString.length });
          fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:38',message:'Interceptor JSON.stringify succeeded',data:{testStringLength:testString.length},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          this.logger.log(`[BigIntSerializerInterceptor] ✅ Successfully serialized response for ${request.method} ${request.url}`);
          return converted;
        } catch (error: any) {
          // #region agent log
          console.log('[DEBUG] Interceptor JSON.stringify failed', { errorMessage: error.message, errorName: error.name, errorStack: error.stack?.substring(0, 500) });
          fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:41',message:'Interceptor JSON.stringify failed',data:{errorMessage:error.message,errorName:error.name},timestamp:Date.now(),runId:'debug1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          this.logger.error(`[BigIntSerializerInterceptor] ❌ Failed to serialize response for ${request.method} ${request.url}`);
          this.logger.error(`[BigIntSerializerInterceptor] Error message: ${error.message}`);
          this.logger.error(`[BigIntSerializerInterceptor] Error stack:`, error.stack);
          this.logger.error(`[BigIntSerializerInterceptor] Response data type: ${typeof data}`);
          this.logger.error(`[BigIntSerializerInterceptor] Response data keys:`, data && typeof data === 'object' ? Object.keys(data) : 'N/A');
          
          // Log a sample of the data to help debug (safely)
          try {
            // Create a safe version for logging
            const safeForLog = (obj: any, depth: number = 0): any => {
              if (depth > 10) return '[Max depth]';
              if (obj === null || obj === undefined) return obj;
              if (typeof obj === 'bigint') return Number(obj);
              if (typeof obj === 'number' && (obj === Infinity || obj === -Infinity || isNaN(obj))) return null;
              if (Array.isArray(obj)) return obj.slice(0, 3).map(item => safeForLog(item, depth + 1)); // Only first 3 items
              if (typeof obj === 'object') {
                const safe: any = {};
                let count = 0;
                for (const key in obj) {
                  if (count++ >= 5) break; // Only first 5 keys
                  if (obj.hasOwnProperty(key)) {
                    try {
                      safe[key] = safeForLog(obj[key], depth + 1);
                    } catch (e) {
                      safe[key] = '[Error]';
                    }
                  }
                }
                return safe;
              }
              return obj;
            };
            const safeData = safeForLog(data);
            this.logger.error(`[BigIntSerializerInterceptor] Data sample (first 500 chars):`, JSON.stringify(safeData).substring(0, 500));
          } catch (e) {
            this.logger.error(`[BigIntSerializerInterceptor] Could not stringify data sample`);
          }
          
          // Try one more time with even more aggressive conversion
          try {
            this.logger.log(`[BigIntSerializerInterceptor] 🔄 Attempting retry conversion...`);
            converted = this.convertBigIntRecursive(data);
            
            // Create a completely new safe object
            const createCompletelySafeObject = (obj: any, depth: number = 0): any => {
              if (depth > 100) return null; // Prevent infinite recursion
              if (obj === null || obj === undefined) return obj;
              if (typeof obj === 'bigint') {
                this.logger.warn(`[BigIntSerializerInterceptor] Found BigInt at depth ${depth} during retry, converting`);
                return Number(obj);
              }
              if (typeof obj === 'number' && (obj === Infinity || obj === -Infinity || isNaN(obj))) {
                return null;
              }
              if (Array.isArray(obj)) {
                return obj.map((item, idx) => {
                  try {
                    return createCompletelySafeObject(item, depth + 1);
                  } catch (e) {
                    return null;
                  }
                });
              }
              if (typeof obj === 'object') {
                const safe: any = {};
                for (const key in obj) {
                  if (obj.hasOwnProperty(key)) {
                    try {
                      safe[key] = createCompletelySafeObject(obj[key], depth + 1);
                    } catch (e) {
                      safe[key] = null; // Skip problematic keys
                    }
                  }
                }
                return safe;
              }
              return obj;
            };
            
            const completelySafe = createCompletelySafeObject(converted);
            
            // Use a custom serializer that handles BigInt
            const safeString = JSON.stringify(completelySafe, (key, value) => {
              if (typeof value === 'bigint') {
                this.logger.warn(`[BigIntSerializerInterceptor] ⚠️ Found BigInt at path: ${key} during retry stringify, converting to number`);
                return Number(value);
              }
              if (typeof value === 'number' && (value === Infinity || value === -Infinity || isNaN(value))) {
                return null;
              }
              return value;
            });
            JSON.parse(safeString); // Verify it can be parsed back
            this.logger.warn(`[BigIntSerializerInterceptor] ✅ Retry conversion succeeded for ${request.method} ${request.url}`);
            return completelySafe;
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
      // #region agent log
      console.log('[DEBUG] Found BigInt in convertBigIntRecursive', { depth, value: String(obj) });
      fetch('http://127.0.0.1:7243/ingest/ee390027-2927-4f9d-bda4-5a730ac487fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bigint-serializer.interceptor.ts:123',message:'Found BigInt in convertBigIntRecursive',data:{depth,value:String(obj)},timestamp:Date.now(),runId:'debug1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
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
