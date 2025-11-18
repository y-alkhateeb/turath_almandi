import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Security Headers with Helmet
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // HTTP Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options
      frameguard: {
        action: 'deny', // Prevent clickjacking by denying iframe embedding
      },
      // Additional security headers
      noSniff: true, // X-Content-Type-Options: nosniff
      xssFilter: true, // X-XSS-Protection: 1; mode=block
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
    }),
  );

  // Global Exception Filters
  // Order matters: more specific filters first
  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // CORS Configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`📊 Health check available at: http://localhost:${port}/api/v1/health`);
  logger.log(`🔒 Environment: ${configService.get('NODE_ENV') || 'development'}`);

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    logger.warn(`Received ${signal} signal. Starting graceful shutdown...`);

    try {
      // Close database connections
      logger.log('Disconnecting from database...');
      await prismaService.$disconnect();
      logger.log('✅ Database connections closed successfully');

      // Close the NestJS application
      logger.log('Closing application...');
      await app.close();
      logger.log('✅ Application closed successfully');

      logger.log(`Graceful shutdown completed for ${signal}`);
      process.exit(0);
    } catch (error) {
      logger.error(`Error during graceful shutdown: ${error.message}`, error.stack);
      process.exit(1);
    }
  };

  // Handle SIGTERM (e.g., from Docker, Kubernetes, or cloud platforms)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle SIGINT (e.g., Ctrl+C in terminal)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
