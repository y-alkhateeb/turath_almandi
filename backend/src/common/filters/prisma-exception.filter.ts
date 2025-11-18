import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { translateError, extractLocale } from '../constants/arabic-errors';
import { ERROR_MESSAGES } from '../constants/error-messages';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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

  private getErrorKey(status: HttpStatus): string {
    switch (status) {
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
}
