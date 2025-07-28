import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip;

    const now = Date.now();

    // Don't log sensitive routes
    const skipLogging = ['/health', '/api/docs', '/favicon.ico'].some((path) =>
      url.includes(path),
    );

    if (skipLogging) {
      return next.handle();
    }

    // Log incoming request
    const requestLog = {
      method,
      url,
      userAgent,
      ip,
      ...(Object.keys(query).length && { query }),
      ...(Object.keys(params).length && { params }),
      ...(method !== 'GET' &&
        body &&
        !this.containsSensitiveData(body) && { body }),
    };

    this.logger.log(`📥 ${method} ${url}`, JSON.stringify(requestLog, null, 2));

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const delay = Date.now() - now;
          const responseLog = {
            method,
            url,
            statusCode: response.statusCode,
            delay: `${delay}ms`,
            ...(responseBody &&
              !this.containsSensitiveData(responseBody) && {
                responseSize: JSON.stringify(responseBody).length,
              }),
          };

          this.logger.log(
            `📤 ${method} ${url} - ${response.statusCode}`,
            JSON.stringify(responseLog, null, 2),
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `❌ ${method} ${url} - ${error.status || 500} - ${delay}ms`,
            error.message,
          );
        },
      }),
    );
  }

  private containsSensitiveData(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;

    const sensitiveFields = [
      'password',
      'token',
      'authorization',
      'secret',
      'key',
      'refresh_token',
      'access_token',
      'refreshToken',
      'accessToken',
    ];

    const objString = JSON.stringify(obj).toLowerCase();
    return sensitiveFields.some((field) => objString.includes(field));
  }
}
