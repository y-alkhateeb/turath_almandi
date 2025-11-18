import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: PrismaService;

  const mockAppService = {
    getHello: jest.fn().mockReturnValue('Hello World!'),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(mockAppService.getHello).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when database is accessible', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.healthCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'Turath Almandi Restaurant Accounting System');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('database');
      expect(result.database.status).toBe('healthy');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return degraded status when database is not accessible', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const result = await appController.healthCheck();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('unhealthy');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should include uptime information', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.healthCheck();

      expect(result.uptime).toHaveProperty('ms');
      expect(result.uptime).toHaveProperty('seconds');
      expect(result.uptime).toHaveProperty('formatted');
      expect(typeof result.uptime.ms).toBe('number');
      expect(typeof result.uptime.seconds).toBe('number');
      expect(result.uptime.formatted).toMatch(/\d+h \d+m \d+s/);
    });

    it('should include memory usage information', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.healthCheck();

      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('external');
      expect(result.memory.rss).toMatch(/\d+\.\d+ MB/);
      expect(result.memory.heapTotal).toMatch(/\d+\.\d+ MB/);
      expect(result.memory.heapUsed).toMatch(/\d+\.\d+ MB/);
      expect(result.memory.external).toMatch(/\d+\.\d+ MB/);
    });

    it('should include database latency', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.healthCheck();

      expect(result.database).toHaveProperty('latency');
      expect(result.database.latency).toMatch(/\d+ms/);
    });

    it('should return valid ISO timestamp', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.healthCheck();

      expect(result.timestamp).toBeDefined();
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should measure uptime correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      // Wait a small amount of time
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await appController.healthCheck();

      expect(result.uptime.ms).toBeGreaterThan(0);
      expect(result.uptime.seconds).toBeGreaterThanOrEqual(0);
    });
  });
});
