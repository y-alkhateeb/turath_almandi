import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate unique request ID
    const requestId = randomUUID();

    // Add request ID to request object
    req.requestId = requestId;

    // Add request ID to response headers
    res.setHeader('X-Request-Id', requestId);

    // Log incoming request with request ID
    this.logger.log(
      `[${requestId}] ${req.method} ${req.url} - IP: ${this.getClientIp(req)}`,
    );

    // Track request timing
    const startTime = Date.now();

    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      const logMessage = `[${requestId}] ${req.method} ${req.url} ${statusCode} - ${duration}ms`;

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

  private getClientIp(req: Request): string {
    // Try to get real IP from various headers (for proxy/load balancer scenarios)
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIp = req.headers['x-real-ip'];

    if (xForwardedFor) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
      return ips.split(',')[0].trim();
    }

    if (xRealIp) {
      return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    }

    // Fall back to connection remote address
    return req.socket.remoteAddress || 'unknown';
  }
}
