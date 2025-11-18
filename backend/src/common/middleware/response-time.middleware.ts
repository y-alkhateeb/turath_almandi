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

    // Log response when it finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      // Add X-Response-Time header
      res.setHeader('X-Response-Time', `${duration}ms`);

      // Log slow requests
      if (duration > this.slowRequestThreshold) {
        this.logSlowRequest(req, duration, requestId);
      }
    });

    next();
  }

  private logSlowRequest(req: Request, duration: number, requestId: string): void {
    const requestDetails = {
      requestId,
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      query: req.query,
      params: req.params,
      ip: this.getClientIp(req),
      userAgent: req.get('user-agent') || 'Unknown',
    };

    this.logger.warn(
      `🐌 Slow Request Detected: [${requestId}] ${req.method} ${req.url} took ${duration}ms`,
    );

    this.logger.debug(
      `[${requestId}] Slow request details:`,
      JSON.stringify(requestDetails, null, 2),
    );
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
