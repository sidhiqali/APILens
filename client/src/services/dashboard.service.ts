import { apiClient } from '@/lib/axios';

// Dashboard Types
export interface DashboardStats {
  totalApis: number;
  activeApis: number;
  totalChanges: number;
  criticalIssues: number;
  healthyApis: number;
  unhealthyApis: number;
  totalNotifications: number;
  unreadNotifications: number;
  recentNotifications: number;
  mostActiveApi?: {
    id: string;
    name: string;
    changeCount: number;
  };
  avgResponseTime: number;
  uptimePercentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'api_change' | 'notification' | 'api_health' | 'api_created';
  title: string;
  description: string;
  timestamp: string;
  apiId?: string;
  apiName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApiHealthSummary {
  id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking' | 'error';
  lastChecked: string;
  changeCount: number;
  isActive: boolean;
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  apiHealthSummary: ApiHealthSummary[];
  criticalAlerts: RecentActivity[];
}

export interface ChangesTrend {
  date: string;
  count: number;
}

class DashboardService {
  private baseUrl = '/dashboard';

  // Get complete dashboard overview
  async getDashboardOverview(): Promise<DashboardOverview> {
    return await apiClient.get<DashboardOverview>(`${this.baseUrl}/overview`);
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return await apiClient.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    return await apiClient.get<RecentActivity[]>(
      `${this.baseUrl}/recent-activity?limit=${limit}`
    );
  }

  // Get API health summary
  async getApiHealthSummary(): Promise<ApiHealthSummary[]> {
    return await apiClient.get<ApiHealthSummary[]>(`${this.baseUrl}/api-health`);
  }

  // Get critical alerts
  async getCriticalAlerts(limit: number = 5): Promise<RecentActivity[]> {
    return await apiClient.get<RecentActivity[]>(
      `${this.baseUrl}/critical-alerts?limit=${limit}`
    );
  }

  // Get API changes trend
  async getApiChangesTrend(days: number = 30): Promise<ChangesTrend[]> {
    return await apiClient.get<ChangesTrend[]>(
      `${this.baseUrl}/changes-trend?days=${days}`
    );
  }
}

export const dashboardService = new DashboardService();
