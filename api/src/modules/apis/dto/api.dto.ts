export class ApiHealthDto {
  id: string;
  apiName: string;
  status: 'healthy' | 'unhealthy' | 'checking' | 'error';
  lastChecked: Date;
  error?: string;
  uptime?: number;
}

export class ApiStatsDto {
  totalApis: number;
  activeApis: number;
  healthyApis: number;
  unhealthyApis: number;
  recentChanges: number;
  totalChanges: number;
}
