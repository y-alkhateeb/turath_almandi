import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Response Time Middleware
 * Measures request duration, adds X-Response-Time header, and logs slow requests
 */
@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ResponseTimeMiddleware.name);
  private readonly slowRequestThreshold = 1000; // 1000ms = 1 second

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = req.requestId || 'unknown';

    // Store original end method
    const originalEnd = res.end;

    // Override end method to capture response time before headers are sent
    res.end = function (this: Response, ...args: any[]): Response {
      const duration = Date.now() - startTime;

      // Set X-Response-Time header before response is sent
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration}ms`);
      }

      // Log slow requests
      if (duration > 1000) {
        const logger = new Logger(ResponseTimeMiddleware.name);
        logger.warn(
          `🐌 Slow Request Detected: [${requestId}] ${req.method} ${req.url} took ${duration}ms`,
        );
      }

      // Call original end method
      return originalEnd.apply(this, args);
    };

    next();
  }

}
