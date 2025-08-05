import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import {
  DashboardStatsDto,
  RecentActivityDto,
  ApiHealthSummaryDto,
  DashboardOverviewDto,
} from './dto/dashboard.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get dashboard overview',
    description:
      'Retrieve comprehensive dashboard data including stats, recent activity, API health summary, and critical alerts',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview data retrieved successfully',
    type: DashboardOverviewDto,
  })
  async getDashboardOverview(@Request() req): Promise<DashboardOverviewDto> {
    return this.dashboardService.getDashboardOverview(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieve aggregated statistics for APIs, changes, notifications, and health metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  async getDashboardStats(@Request() req): Promise<DashboardStatsDto> {
    return this.dashboardService.getDashboardStats(req.user.userId);
  }

  @Get('recent-activity')
  @ApiOperation({
    summary: 'Get recent activity',
    description:
      'Retrieve recent activity including API changes and notifications',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of activities to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
    type: [RecentActivityDto],
  })
  async getRecentActivity(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<RecentActivityDto[]> {
    return this.dashboardService.getRecentActivity(
      req.user.userId,
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Get('api-health')
  @ApiOperation({
    summary: 'Get API health summary',
    description: 'Retrieve health status summary for all user APIs',
  })
  @ApiResponse({
    status: 200,
    description: 'API health summary retrieved successfully',
    type: [ApiHealthSummaryDto],
  })
  async getApiHealthSummary(@Request() req): Promise<ApiHealthSummaryDto[]> {
    return this.dashboardService.getApiHealthSummary(req.user.userId);
  }

  @Get('critical-alerts')
  @ApiOperation({
    summary: 'Get critical alerts',
    description:
      'Retrieve critical alerts including breaking changes and API health issues',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of alerts to return',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Critical alerts retrieved successfully',
    type: [RecentActivityDto],
  })
  async getCriticalAlerts(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<RecentActivityDto[]> {
    return this.dashboardService.getCriticalAlerts(
      req.user.userId,
      limit ? parseInt(limit.toString()) : 5,
    );
  }

  @Get('changes-trend')
  @ApiOperation({
    summary: 'Get API changes trend',
    description: 'Retrieve API changes trend data over specified time period',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'API changes trend data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          count: { type: 'number' },
        },
      },
    },
  })
  async getApiChangesTrend(
    @Request() req,
    @Query('days') days?: number,
  ): Promise<{ date: string; count: number }[]> {
    return this.dashboardService.getApiChangesTrend(
      req.user.userId,
      days ? parseInt(days.toString()) : 30,
    );
  }
}
