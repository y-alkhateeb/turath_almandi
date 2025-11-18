import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { translateError, extractLocale } from '../constants/arabic-errors';
import { ERROR_MESSAGES } from '../constants/error-messages';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log detailed error information
    this.logDetailedError(exception, request);

    // Extract locale from Accept-Language header
    const locale = extractLocale(request.headers['accept-language']);

    let status: HttpStatus;
    let messageKey: string;

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        messageKey = this.handleP2002(exception);
        break;

      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        messageKey = this.handleP2003(exception);
        break;

      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        messageKey = ERROR_MESSAGES.DATABASE.RECORD_NOT_FOUND;
        break;

      default:
        // Internal server error for other Prisma errors
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        messageKey = ERROR_MESSAGES.DATABASE.UNEXPECTED_ERROR;
        break;
    }

    // Translate the message and error name based on locale
    const translatedMessage = translateError(messageKey, locale);
    const translatedError = translateError(this.getErrorKey(status), locale);

    response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      error: translatedError,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private handleP2002(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const meta = exception.meta as { target?: string[] };
    const fields = meta?.target;

    // Check for specific unique constraint violations
    if (fields?.includes('username')) {
      return ERROR_MESSAGES.DATABASE.USERNAME_EXISTS;
    }

    if (fields?.includes('email')) {
      return ERROR_MESSAGES.DATABASE.EMAIL_EXISTS;
    }

    // Generic unique constraint violation
    return ERROR_MESSAGES.HTTP.CONFLICT;
  }

  private handleP2003(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const meta = exception.meta as { field_name?: string };
    const fieldName = meta?.field_name;

    // Check for specific foreign key constraint violations
    if (fieldName?.includes('branch_id') || fieldName?.includes('branchId')) {
      return ERROR_MESSAGES.DATABASE.INVALID_BRANCH_REFERENCE;
    }

    if (fieldName?.includes('user_id') || fieldName?.includes('userId') || fieldName?.includes('created_by') || fieldName?.includes('recorded_by')) {
      return ERROR_MESSAGES.DATABASE.INVALID_USER_REFERENCE;
    }

    if (fieldName?.includes('inventory_item_id') || fieldName?.includes('inventoryItemId')) {
      return ERROR_MESSAGES.DATABASE.INVALID_INVENTORY_REFERENCE;
    }

    if (fieldName?.includes('debt_id') || fieldName?.includes('debtId')) {
      return ERROR_MESSAGES.DATABASE.INVALID_DEBT_REFERENCE;
    }

    // Generic foreign key constraint violation
    return ERROR_MESSAGES.DATABASE.FOREIGN_KEY_CONSTRAINT;
  }

  private getErrorKey(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_MESSAGES.HTTP.BAD_REQUEST;
      case HttpStatus.CONFLICT:
        return ERROR_MESSAGES.HTTP.CONFLICT;
      case HttpStatus.NOT_FOUND:
        return ERROR_MESSAGES.HTTP.NOT_FOUND;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ERROR_MESSAGES.HTTP.INTERNAL_SERVER_ERROR;
      default:
        return 'error';
    }
  }

  private logDetailedError(
    exception: Prisma.PrismaClientKnownRequestError,
    request: Request,
  ): void {
    const requestId = request.requestId || 'unknown';

    const errorDetails = {
      requestId,
      code: exception.code,
      message: exception.message,
      meta: exception.meta,
      clientVersion: exception.clientVersion,
      request: {
        method: request.method,
        url: request.url,
        body: this.sanitizeRequestBody(request.body),
        params: request.params,
        query: request.query,
      },
    };

    this.logger.error(
      `[${requestId}] Prisma Error [${exception.code}]: ${exception.message}`,
      exception.stack,
    );

    this.logger.debug(
      `[${requestId}] Detailed error information:`,
      JSON.stringify(errorDetails, null, 2),
    );
  }

  private sanitizeRequestBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) {
      return {};
    }

    // Create a shallow copy to avoid modifying the original
    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
