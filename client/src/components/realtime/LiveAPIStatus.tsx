'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useRealtimeAPIUpdates, useAPISubscription } from '@/providers/RealtimeProvider';
import type { RealtimeAPIUpdate } from '@/providers/RealtimeProvider';

interface APIStatus {
  id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  responseTime?: number;
  uptime?: number;
  lastChecked: string;
  trend?: 'up' | 'down' | 'stable';
  errorCount?: number;
  alertsCount?: number;
}

interface LiveAPIStatusProps {
  apis: APIStatus[];
  onAPIClick?: (apiId: string) => void;
  className?: string;
  showMetrics?: boolean;
  showTrends?: boolean;
  compact?: boolean;
}

const LiveAPIStatus: React.FC<LiveAPIStatusProps> = ({
  apis: initialAPIs,
  onAPIClick,
  className = '',
  showMetrics = true,
  showTrends = true,
  compact = false,
}) => {
  const [apis, setApis] = useState<APIStatus[]>(initialAPIs);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Subscribe to real-time updates for all APIs
  initialAPIs.forEach(api => {
    useAPISubscription(api.id);
  });

  // Handle real-time API updates
  useRealtimeAPIUpdates((update: RealtimeAPIUpdate) => {
    setApis(prevApis => 
      prevApis.map(api => 
        api.id === update.apiId
          ? {
              ...api,
              status: update.status,
              responseTime: update.responseTime || api.responseTime,
              uptime: update.uptime || api.uptime,
              lastChecked: update.lastChecked,
              // Calculate trend based on response time change
              trend: calculateTrend(api.responseTime, update.responseTime),
            }
          : api
      )
    );
    setLastUpdate(new Date().toISOString());
  });

  const calculateTrend = (oldValue?: number, newValue?: number): 'up' | 'down' | 'stable' => {
    if (!oldValue || !newValue) return 'stable';
    const percentageChange = ((newValue - oldValue) / oldValue) * 100;
    if (percentageChange > 10) return 'down'; // Worse performance
    if (percentageChange < -10) return 'up'; // Better performance
    return 'stable';
  };

  const getStatusIcon = (status: APIStatus['status']) => {
    const iconProps = { className: 'w-4 h-4' };
    
    switch (status) {
      case 'healthy':
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-600" />;
      case 'unhealthy':
        return <AlertTriangle {...iconProps} className="w-4 h-4 text-red-600" />;
      case 'checking':
        return <Clock {...iconProps} className="w-4 h-4 text-yellow-600 animate-pulse" />;
      default:
        return <Activity {...iconProps} className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: APIStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'unhealthy':
        return 'border-red-200 bg-red-50';
      case 'checking':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    const iconProps = { className: 'w-3 h-3' };
    
    switch (trend) {
      case 'up':
        return <TrendingUp {...iconProps} className="w-3 h-3 text-green-600" />;
      case 'down':
        return <TrendingDown {...iconProps} className="w-3 h-3 text-red-600" />;
      case 'stable':
        return <Minus {...iconProps} className="w-3 h-3 text-gray-400" />;
      default:
        return null;
    }
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const formatUptime = (percentage?: number) => {
    if (percentage === undefined) return 'N/A';
    return `${percentage.toFixed(1)}%`;
  };

  const formatLastChecked = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className={clsx('space-y-2', className)}>
        {apis.map((api) => (
          <div
            key={api.id}
            onClick={() => onAPIClick?.(api.id)}
            className={clsx(
              'flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer hover:shadow-sm',
              getStatusColor(api.status),
              onAPIClick && 'hover:scale-[1.02]'
            )}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(api.status)}
              <span className="font-medium text-gray-900 truncate">{api.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {showTrends && api.trend && getTrendIcon(api.trend)}
              {showMetrics && api.responseTime && (
                <span className="text-xs text-gray-600">
                  {formatResponseTime(api.responseTime)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live API Status</h3>
        <div className="flex items-center space-x-2">
          {lastUpdate && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Updated {formatLastChecked(lastUpdate)}</span>
            </div>
          )}
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* API Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apis.map((api) => (
          <div
            key={api.id}
            onClick={() => onAPIClick?.(api.id)}
            className={clsx(
              'p-4 border rounded-lg transition-all',
              getStatusColor(api.status),
              onAPIClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'cursor-default'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(api.status)}
                <h4 className="font-medium text-gray-900 truncate">{api.name}</h4>
              </div>
              {showTrends && api.trend && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon(api.trend)}
                </div>
              )}
            </div>

            {/* Metrics */}
            {showMetrics && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Response Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatResponseTime(api.responseTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Uptime</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatUptime(api.uptime)}
                  </p>
                </div>
              </div>
            )}

            {/* Alerts */}
            {(api.errorCount || api.alertsCount) && (
              <div className="flex items-center space-x-4 mb-3">
                {api.errorCount && api.errorCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-xs text-red-600">{api.errorCount} errors</span>
                  </div>
                )}
                {api.alertsCount && api.alertsCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-orange-600" />
                    <span className="text-xs text-orange-600">{api.alertsCount} alerts</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-gray-500">
              Last checked: {formatLastChecked(api.lastChecked)}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {apis.length === 0 && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No APIs Monitoring</h3>
          <p className="text-gray-600">Add APIs to start monitoring their real-time status.</p>
        </div>
      )}
    </div>
  );
};

// Summary component for overview
interface LiveAPIStatusSummaryProps {
  apis: APIStatus[];
  className?: string;
}

export const LiveAPIStatusSummary: React.FC<LiveAPIStatusSummaryProps> = ({
  apis,
  className = '',
}) => {
  const healthyCount = apis.filter(api => api.status === 'healthy').length;
  const unhealthyCount = apis.filter(api => api.status === 'unhealthy').length;
  const checkingCount = apis.filter(api => api.status === 'checking').length;
  
  const avgResponseTime = apis.reduce((sum, api) => sum + (api.responseTime || 0), 0) / apis.length;
  const avgUptime = apis.reduce((sum, api) => sum + (api.uptime || 0), 0) / apis.length;

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">API Health Summary</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{healthyCount}</span>
          </div>
          <p className="text-xs text-gray-600">Healthy</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-2xl font-bold text-red-600">{unhealthyCount}</span>
          </div>
          <p className="text-xs text-gray-600">Unhealthy</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-600">{checkingCount}</span>
          </div>
          <p className="text-xs text-gray-600">Checking</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{apis.length}</span>
          </div>
          <p className="text-xs text-gray-600">Total</p>
        </div>
      </div>
      
      {apis.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Avg Response Time</p>
              <p className="text-sm font-medium text-gray-900">
                {avgResponseTime.toFixed(0)}ms
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Uptime</p>
              <p className="text-sm font-medium text-gray-900">
                {avgUptime.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAPIStatus;
