import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  private readonly startTime: number;

  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {
    this.startTime = Date.now();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async healthCheck() {
    const now = Date.now();
    const uptimeMs = now - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

    // Database health check
    let databaseStatus = 'unknown';
    let databaseLatency = 0;
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      databaseLatency = Date.now() - dbStart;
      databaseStatus = 'healthy';
    } catch (error) {
      databaseStatus = 'unhealthy';
    }

    const health = {
      status: databaseStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'Turath Almandi Restaurant Accounting System',
      uptime: {
        ms: uptimeMs,
        seconds: uptimeSeconds,
        formatted: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`,
      },
      memory: {
        rss: `${formatBytes(memoryUsage.rss)} MB`,
        heapTotal: `${formatBytes(memoryUsage.heapTotal)} MB`,
        heapUsed: `${formatBytes(memoryUsage.heapUsed)} MB`,
        external: `${formatBytes(memoryUsage.external)} MB`,
      },
      database: {
        status: databaseStatus,
        latency: `${databaseLatency}ms`,
      },
    };

    return health;
  }
}
