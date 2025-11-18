import * as Joi from 'joi';

/**
 * Environment Variables Validation Schema
 *
 * This schema validates all required environment variables on application startup.
 * If any required variable is missing or invalid, the application will fail to start
 * with a descriptive error message.
 *
 * Purpose:
 * - Prevent runtime errors due to missing configuration
 * - Ensure correct data types for all environment variables
 * - Provide early feedback during deployment
 * - Document all required configuration
 *
 * Usage:
 * - Automatically applied in app.module.ts via ConfigModule.forRoot({ validationSchema })
 * - Validates on application bootstrap
 * - Throws error if validation fails
 */

/**
 * Validation schema for environment variables
 *
 * Required Variables:
 * - NODE_ENV: Application environment (development, production, test)
 * - PORT: Server port number
 * - DATABASE_URL: PostgreSQL connection string
 * - JWT_SECRET: Secret key for signing access tokens (min 32 chars for security)
 * - JWT_REFRESH_SECRET: Secret key for refresh tokens (min 32 chars for security)
 * - JWT_ACCESS_TOKEN_EXPIRATION: Token expiration time (e.g., 15m, 1h, 7d)
 * - JWT_REFRESH_TOKEN_EXPIRATION: Refresh token expiration in days
 * - JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME: Extended expiration for "remember me"
 * - FRONTEND_URL: Frontend application URL for CORS
 * - BCRYPT_SALT_ROUNDS: Number of bcrypt salt rounds (default: 10)
 *
 * Optional Variables:
 * - REDIS_URL: Redis connection string (falls back to in-memory if not provided)
 * - OVERDUE_DEBT_CHECK_CRON: CRON expression for debt checking (default: 0 9 * * *)
 */
export const envValidationSchema = Joi.object({
  // Application Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),

  PORT: Joi.number()
    .port()
    .default(3000)
    .description('Server port number'),

  // Database Configuration
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required()
    .description('PostgreSQL connection string')
    .messages({
      'any.required': 'DATABASE_URL is required. Please provide a valid PostgreSQL connection string.',
      'string.uri': 'DATABASE_URL must be a valid PostgreSQL URI (postgresql://...)',
    }),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Secret key for JWT access tokens (minimum 32 characters)')
    .messages({
      'any.required': 'JWT_SECRET is required. Generate a secure random string (min 32 chars).',
      'string.min': 'JWT_SECRET must be at least 32 characters for security reasons.',
    }),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Secret key for JWT refresh tokens (minimum 32 characters)')
    .messages({
      'any.required': 'JWT_REFRESH_SECRET is required. Generate a secure random string (min 32 chars).',
      'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters for security reasons.',
    }),

  JWT_ACCESS_TOKEN_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d')
    .description('JWT access token expiration time (e.g., 15m, 1h, 7d)')
    .messages({
      'string.pattern.base':
        'JWT_ACCESS_TOKEN_EXPIRATION must be in format: number + unit (s/m/h/d), e.g., 15m, 1h, 7d',
    }),

  JWT_REFRESH_TOKEN_EXPIRATION: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(7)
    .description('JWT refresh token expiration in days (1-365)')
    .messages({
      'number.min': 'JWT_REFRESH_TOKEN_EXPIRATION must be at least 1 day',
      'number.max': 'JWT_REFRESH_TOKEN_EXPIRATION cannot exceed 365 days',
    }),

  JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .description('JWT refresh token expiration for "remember me" in days (1-365)')
    .messages({
      'number.min': 'JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME must be at least 1 day',
      'number.max': 'JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME cannot exceed 365 days',
    }),

  // CORS / Frontend Configuration
  FRONTEND_URL: Joi.string()
    .uri()
    .required()
    .description('Frontend application URL for CORS configuration')
    .messages({
      'any.required': 'FRONTEND_URL is required. Provide the frontend application URL (e.g., http://localhost:5173)',
      'string.uri': 'FRONTEND_URL must be a valid URL',
    }),

  // Bcrypt Configuration
  BCRYPT_SALT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(10)
    .description('Number of bcrypt salt rounds (10-15, default: 10)')
    .messages({
      'number.min': 'BCRYPT_SALT_ROUNDS must be at least 10 for security',
      'number.max': 'BCRYPT_SALT_ROUNDS should not exceed 15 (performance impact)',
    }),

  // Redis Configuration (Optional)
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional()
    .description('Redis connection string (optional, falls back to in-memory storage)')
    .messages({
      'string.uri': 'REDIS_URL must be a valid Redis URI (redis://... or rediss://...)',
    }),

  // Scheduled Tasks Configuration (Optional)
  OVERDUE_DEBT_CHECK_CRON: Joi.string()
    .pattern(/^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([01]?\d|2\d|3[01])) (\*|([1-9]|1[0-2])) (\*|[0-6])$/)
    .default('0 9 * * *')
    .description('CRON expression for overdue debt checking (default: 0 9 * * * = daily at 9 AM)')
    .messages({
      'string.pattern.base':
        'OVERDUE_DEBT_CHECK_CRON must be a valid CRON expression (e.g., "0 9 * * *")',
    }),
});

/**
 * Type definition for validated environment variables
 *
 * This interface can be used throughout the application for type-safe
 * access to environment variables via ConfigService.
 *
 * Usage:
 * ```typescript
 * constructor(private configService: ConfigService<EnvironmentVariables>) {}
 *
 * const dbUrl = this.configService.get('DATABASE_URL', { infer: true });
 * ```
 */
export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRATION: string;
  JWT_REFRESH_TOKEN_EXPIRATION: number;
  JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME: number;
  FRONTEND_URL: string;
  BCRYPT_SALT_ROUNDS: number;
  REDIS_URL?: string;
  OVERDUE_DEBT_CHECK_CRON: string;
}
