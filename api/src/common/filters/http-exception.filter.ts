import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exceptionResponse;
        error = (exceptionResponse as any).error || exception.name;
      } else {
        message = exceptionResponse;
        error = exception.name;
      }
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;

      // Handle MongoDB specific errors
      switch (exception.code) {
        case 11000: // Duplicate key error
          const field = Object.keys((exception as any).keyPattern || {})[0];
          message = `${field} already exists`;
          error = 'Duplicate Entry';
          break;
        case 121: // Document validation failure
          message = 'Document validation failed';
          error = 'Validation Error';
          break;
        default:
          message = 'Database operation failed';
          error = 'Database Error';
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      error = exception.name || 'Internal Server Error';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Unknown Error';
    }

    // Log the error
    const errorLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    // Send error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    });
  }
}
