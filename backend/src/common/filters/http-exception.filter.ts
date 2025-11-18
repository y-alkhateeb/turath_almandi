import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { translateError, extractLocale, translateValidationErrors } from '../constants/arabic-errors';

interface ValidationError {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract locale from Accept-Language header
    const locale = extractLocale(request.headers['accept-language']);

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as ValidationError | string;

    let message: string | string[];
    let error: string;

    // Handle different response formats
    if (typeof exceptionResponse === 'string') {
      // Simple string message
      message = translateError(exceptionResponse, locale);
      error = translateError(this.getErrorKey(status), locale);
    } else if (typeof exceptionResponse === 'object') {
      // Structured response (e.g., validation errors)
      if (Array.isArray(exceptionResponse.message)) {
        // Multiple validation errors
        message = exceptionResponse.message.map((msg) => translateError(msg, locale));
      } else if (typeof exceptionResponse.message === 'string') {
        // Single error message
        message = translateError(exceptionResponse.message, locale);
      } else {
        message = translateError('validationFailed', locale);
      }

      error = exceptionResponse.error
        ? translateError(exceptionResponse.error, locale)
        : translateError(this.getErrorKey(status), locale);
    } else {
      // Fallback
      message = translateError('unexpectedDatabaseError', locale);
      error = translateError(this.getErrorKey(status), locale);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getErrorKey(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'badRequest';
      case HttpStatus.UNAUTHORIZED:
        return 'unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'forbidden';
      case HttpStatus.NOT_FOUND:
        return 'notFound';
      case HttpStatus.CONFLICT:
        return 'conflict';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'internalServerError';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'serviceUnavailable';
      default:
        return 'error';
    }
  }
}
