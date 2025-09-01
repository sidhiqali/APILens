'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import {
  useDashboardOverview,
  useDashboardStats,
  useCriticalAlerts,
} from '@/hooks/useDashboard';
import { useRealTimeDashboard } from '@/hooks/useRealtime';
import QuickActions from './QuickActions';
import StatsCards from './StatsCards';
import RecentActivity from './RecentActivity';
import HealthMonitor from './HealthMonitor';
import CriticalAlerts from './CriticalAlerts';

interface DashboardOverviewProps {
  className?: string;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  className = '',
}) => {
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useDashboardOverview();

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats();

  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
  } = useCriticalAlerts();

  useRealTimeDashboard();

  if (overviewLoading || statsLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (overviewError || statsError) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Failed to Load Dashboard
        </h3>
        <p className="mb-4 text-gray-600">
          There was an error loading your dashboard data. Please try refreshing
          the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Refresh Dashboard
        </button>
      </div>
    );
  }

  const overview = overviewData;
  const stats = statsData;
  const alerts = alertsData;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Monitor your APIs and track changes in real-time
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Updates</span>
          </div>
          <QuickActions />
        </div>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            <span className="font-medium text-red-800">
              {alerts.length} Critical Alert{alerts.length > 1 ? 's' : ''}{' '}
              Require Attention
            </span>
          </div>
        </div>
      )}

      <StatsCards stats={stats} loading={statsLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentActivity
            data={overview?.recentActivity}
            loading={overviewLoading}
          />

          <HealthMonitor
            apis={
              overview?.apiHealthSummary?.map((api) => ({
                id: api.id,
                name: api.name,
                status: api.status,
                responseTime: 200,
                uptime: 99.5,
                lastChecked: api.lastChecked,
                trend: 'stable' as const,
              })) || []
            }
            loading={overviewLoading}
          />
        </div>

        <div className="space-y-6">
          <CriticalAlerts
            alerts={
              alerts?.map((alert) => ({
                id: alert.id,
                title: alert.title,
                message: alert.description,
                severity: alert.severity,
                apiId: alert.apiId || '',
                apiName: alert.apiName || '',
                timestamp: alert.timestamp,
                type: 'api_down' as const,
                acknowledged: false,
                autoResolve: false,
              })) || []
            }
            loading={alertsLoading}
            error={alertsError}
          />

          {overview?.apiHealthSummary &&
            overview.apiHealthSummary.length > 0 && (
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Health Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Healthy</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        overview.apiHealthSummary.filter(
                          (api) => api.status === 'healthy'
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-600">Unhealthy</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        overview.apiHealthSummary.filter(
                          (api) => api.status === 'unhealthy'
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-gray-600">Checking</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {
                        overview.apiHealthSummary.filter(
                          (api) => api.status === 'checking'
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

          {stats && (
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Avg Response Time
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-900">
                      {stats.avgResponseTime}ms
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {stats.uptimePercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton: React.FC = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="w-48 h-8 mb-2 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-64 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 bg-white border rounded-lg shadow-sm">
            <div className="w-24 h-4 mb-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <div className="w-32 h-6 mb-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <div className="w-32 h-6 mb-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardOverview;
