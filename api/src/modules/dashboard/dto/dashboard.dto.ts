import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of APIs', example: 15 })
  totalApis: number;

  @ApiProperty({ description: 'Number of active APIs', example: 12 })
  activeApis: number;

  @ApiProperty({ description: 'Number of healthy APIs', example: 10 })
  healthyApis: number;

  @ApiProperty({ description: 'Number of unhealthy APIs', example: 2 })
  unhealthyApis: number;

  @ApiProperty({ description: 'Total number of changes detected', example: 45 })
  totalChanges: number;

  @ApiProperty({ description: 'Number of changes in last 7 days', example: 8 })
  recentChanges: number;

  @ApiProperty({
    description: 'Number of breaking changes in last 30 days',
    example: 3,
  })
  breakingChanges: number;

  @ApiProperty({
    description: 'Number of non-breaking changes in last 30 days',
    example: 12,
  })
  nonBreakingChanges: number;

  @ApiProperty({ description: 'Total number of notifications', example: 25 })
  totalNotifications: number;

  @ApiProperty({ description: 'Number of unread notifications', example: 5 })
  unreadNotifications: number;

  @ApiProperty({
    description: 'Number of notifications in last 7 days',
    example: 7,
  })
  recentNotifications: number;

  @ApiProperty({
    description: 'Most active API information',
    example: {
      id: '507f1f77bcf86cd799439011',
      name: 'Payment API',
      changeCount: 12,
    },
    nullable: true,
  })
  mostActiveApi: {
    id: string;
    name: string;
    changeCount: number;
  } | null;

  @ApiProperty({
    description: 'Average response time in milliseconds',
    example: 245,
  })
  avgResponseTime: number;

  @ApiProperty({ description: 'API uptime percentage', example: 98.5 })
  uptimePercentage: number;
}

export class RecentActivityDto {
  @ApiProperty({
    description: 'Activity ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Type of activity',
    enum: ['api_change', 'api_added', 'notification', 'api_health'],
    example: 'api_change',
  })
  type: 'api_change' | 'api_added' | 'notification' | 'api_health';

  @ApiProperty({
    description: 'Activity title',
    example: 'API Change Detected',
  })
  title: string;

  @ApiProperty({
    description: 'Activity description',
    example: '3 changes in Payment API',
  })
  description: string;

  @ApiProperty({
    description: 'Activity timestamp',
    example: '2025-08-05T10:30:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Related API ID',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  apiId?: string;

  @ApiProperty({
    description: 'Related API name',
    example: 'Payment API',
    required: false,
  })
  apiName?: string;

  @ApiProperty({
    description: 'Activity severity',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
    required: false,
  })
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export class ApiHealthSummaryDto {
  @ApiProperty({ description: 'API ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'API name', example: 'Payment API' })
  name: string;

  @ApiProperty({
    description: 'API health status',
    enum: ['healthy', 'unhealthy', 'checking', 'error'],
    example: 'healthy',
  })
  status: 'healthy' | 'unhealthy' | 'checking' | 'error';

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 150,
    required: false,
  })
  responseTime?: number;

  @ApiProperty({
    description: 'Last health check timestamp',
    example: '2025-08-05T10:30:00Z',
  })
  lastChecked: Date;

  @ApiProperty({ description: 'Number of changes detected', example: 5 })
  changeCount: number;

  @ApiProperty({
    description: 'Whether API monitoring is active',
    example: true,
  })
  isActive: boolean;
}

export class DashboardOverviewDto {
  @ApiProperty({ description: 'Dashboard statistics', type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({
    description: 'Recent activity list',
    type: [RecentActivityDto],
    isArray: true,
  })
  recentActivity: RecentActivityDto[];

  @ApiProperty({
    description: 'API health summary list',
    type: [ApiHealthSummaryDto],
    isArray: true,
  })
  apiHealthSummary: ApiHealthSummaryDto[];

  @ApiProperty({
    description: 'Critical alerts list',
    type: [RecentActivityDto],
    isArray: true,
  })
  criticalAlerts: RecentActivityDto[];
}
