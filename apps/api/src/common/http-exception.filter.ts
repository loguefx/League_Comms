import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Log error (sanitize any BigInt values)
    try {
      const errorMessage = exception instanceof Error ? exception.stack : this.sanitizeForLogging(exception);
      this.logger.error(
        `${request.method} ${request.url}`,
        errorMessage
      );
    } catch (logError) {
      this.logger.error(
        `${request.method} ${request.url}`,
        'Error occurred (failed to log details)'
      );
    }

    // Return user-friendly error (ensure no BigInt values)
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any)?.message || 'An error occurred',
    };

    // Sanitize the error response to ensure no BigInt values
    const sanitizedResponse = this.sanitizeBigInt(errorResponse);
    
    try {
      response.status(status).send(sanitizedResponse);
    } catch (sendError: any) {
      // If sending fails, try with a minimal safe response
      this.logger.error('Failed to send error response, using minimal response');
      response.status(status).send({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'An error occurred',
      });
    }
  }

  /**
   * Recursively convert BigInt values to numbers for logging
   */
  private sanitizeForLogging(obj: any): string {
    try {
      const sanitized = this.sanitizeBigInt(obj);
      return JSON.stringify(sanitized);
    } catch {
      return String(obj);
    }
  }

  /**
   * Recursively convert BigInt values to numbers
   */
  private sanitizeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeBigInt(item));
    }
    
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        try {
          converted[key] = this.sanitizeBigInt(obj[key]);
        } catch {
          // Skip problematic keys
        }
      }
      return converted;
    }
    
    return obj;
  }
}
