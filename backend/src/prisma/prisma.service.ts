import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // Log Prisma warnings and errors
    this.$on('warn' as never, (e: unknown) => {
      this.logger.warn(e);
    });

    this.$on('error' as never, (e: unknown) => {
      this.logger.error(e);
    });

    // Middleware to log slow queries (>1000ms)
    this.$use(async (params, next) => {
      const startTime = Date.now();
      const result = await next(params);
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        this.logSlowQuery(params, duration);
      }

      return result;
    });
  }

  async onModuleInit() {
    const maxRetries = 5;
    const retryDelay = 3000; // 3 seconds

    for (let i = 1; i <= maxRetries; i++) {
      try {
        this.logger.log(`Attempting to connect to database (attempt ${i}/${maxRetries})...`);
        await this.$connect();
        this.logger.log('✅ Database connected successfully');
        return;
      } catch (error) {
        this.logger.error(`Failed to connect to database (attempt ${i}/${maxRetries}): ${error.message}`);

        if (i === maxRetries) {
          this.logger.error('❌ Failed to connect to database after maximum retries');
          throw error;
        }

        this.logger.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('👋 Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // Useful for testing - clean all tables
    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

    return Promise.all(models.map((modelKey) => this[modelKey].deleteMany()));
  }

  private logSlowQuery(params: { model?: string; action: string; args: unknown }, duration: number): void {
    const queryInfo = {
      model: params.model || 'Unknown',
      action: params.action,
      duration: `${duration}ms`,
      args: this.sanitizeQueryArgs(params.args),
    };

    this.logger.warn(
      `🐌 Slow Query Detected: ${queryInfo.model}.${queryInfo.action} took ${queryInfo.duration}`,
    );

    this.logger.debug(
      'Slow query details:',
      JSON.stringify(queryInfo, null, 2),
    );
  }

  private sanitizeQueryArgs(args: unknown): unknown {
    if (!args || typeof args !== 'object') {
      return args;
    }

    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(args));

    // Remove sensitive fields from query args
    const sensitiveFields = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken'];

    const sanitizeObject = (obj: Record<string, unknown>): void => {
      for (const key in obj) {
        if (sensitiveFields.includes(key)) {
          obj[key] = '***REDACTED***';
        } else if (obj[key] && typeof obj[key] === 'object') {
          sanitizeObject(obj[key] as Record<string, unknown>);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }
}
