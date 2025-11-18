import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTP Request Logger Middleware
 * Logs incoming HTTP requests with method, URL, status code, IP address, and user-agent
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'Unknown';
    const startTime = Date.now();

    // Log the response when it finishes
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';
      const responseTime = Date.now() - startTime;

      // Format: METHOD URL STATUS_CODE - IP - USER_AGENT - RESPONSE_TIME ms
      const logMessage = `${method} ${originalUrl} ${statusCode} - ${ip} - ${userAgent} - ${responseTime}ms - ${contentLength} bytes`;

      // Log with appropriate level based on status code
      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
