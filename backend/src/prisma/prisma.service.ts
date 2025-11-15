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
    this.$on('warn' as never, (e: any) => {
      this.logger.warn(e);
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(e);
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
}
