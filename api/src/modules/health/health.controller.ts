// api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Check application health',
    description: 'Performs health checks on database, memory, and disk usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            memory_heap: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            memory_rss: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            storage: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
          },
        },
        error: { type: 'object' },
        details: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            memory_heap: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            memory_rss: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            storage: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Health check failed',
  })
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),

      // Memory health checks
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB

      // Disk health check
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9, // 90%
        }),
    ]);
  }

  @Get('simple')
  @ApiOperation({
    summary: 'Simple health check',
    description: 'Returns basic application status without detailed checks',
  })
  @ApiResponse({
    status: 200,
    description: 'Simple health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-12-01T10:30:00.000Z' },
        uptime: { type: 'number', example: 3600.5 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  simpleCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
    };
  }
}
