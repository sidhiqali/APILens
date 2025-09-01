'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3,
  Eye,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  useRealtimeMetrics,
  useAPISubscription,
} from '@/providers/RealtimeProvider';
import type { RealtimeMetrics } from '@/providers/RealtimeProvider';

interface MetricValue {
  value: number;
  timestamp: string;
  trend?: 'up' | 'down' | 'stable';
}

interface APIMetrics {
  apiId: string;
  apiName: string;
  responseTime: MetricValue;
  uptime: MetricValue;
  errorRate: MetricValue;
  requestCount: MetricValue;
  lastUpdate: string;
}

interface LiveMetricsProps {
  apis: APIMetrics[];
  onAPIClick?: (apiId: string) => void;
  className?: string;
  showCharts?: boolean;
  refreshInterval?: number;
  alertThresholds?: {
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
}

const LiveMetrics: React.FC<LiveMetricsProps> = ({
  apis: initialAPIs,
  onAPIClick,
  className = '',
  alertThresholds = {
    responseTime: 2000,
    errorRate: 5,
    uptime: 99,
  },
}) => {
  const [metrics, setMetrics] = useState<APIMetrics[]>(initialAPIs);
  const [isLive, setIsLive] = useState(true);

  initialAPIs.forEach((api) => {
    useAPISubscription(api.apiId);
  });

  useRealtimeMetrics((update: RealtimeMetrics) => {
    setMetrics((prevMetrics) =>
      prevMetrics.map((apiMetrics) =>
        apiMetrics.apiId === update.apiId
          ? {
              ...apiMetrics,
              responseTime: {
                value: update.metrics.responseTime,
                timestamp: update.metrics.timestamp,
                trend: calculateTrend(
                  apiMetrics.responseTime.value,
                  update.metrics.responseTime
                ),
              },
              uptime: {
                value: update.metrics.uptime,
                timestamp: update.metrics.timestamp,
                trend: calculateTrend(
                  apiMetrics.uptime.value,
                  update.metrics.uptime
                ),
              },
              errorRate: {
                value: update.metrics.errorRate,
                timestamp: update.metrics.timestamp,
                trend: calculateTrend(
                  apiMetrics.errorRate.value,
                  update.metrics.errorRate,
                  true
                ),
              },
              requestCount: {
                value: update.metrics.requestCount,
                timestamp: update.metrics.timestamp,
                trend: calculateTrend(
                  apiMetrics.requestCount.value,
                  update.metrics.requestCount
                ),
              },
              lastUpdate: update.metrics.timestamp,
            }
          : apiMetrics
      )
    );
  });

  const calculateTrend = (
    oldValue: number,
    newValue: number,
    inverse = false
  ): 'up' | 'down' | 'stable' => {
    const percentageChange = ((newValue - oldValue) / oldValue) * 100;
    const threshold = 5;

    if (Math.abs(percentageChange) < threshold) return 'stable';

    const isImprovement = inverse ? percentageChange < 0 : percentageChange > 0;
    return isImprovement ? 'up' : 'down';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', inverse = false) => {
    const iconProps = { className: 'w-3 h-3' };

    switch (trend) {
      case 'up':
        return (
          <TrendingUp
            {...iconProps}
            className={clsx(
              'w-3 h-3',
              inverse ? 'text-red-500' : 'text-green-500'
            )}
          />
        );
      case 'down':
        return (
          <TrendingDown
            {...iconProps}
            className={clsx(
              'w-3 h-3',
              inverse ? 'text-green-500' : 'text-red-500'
            )}
          />
        );
      case 'stable':
        return <Activity {...iconProps} className="w-3 h-3 text-gray-400" />;
      default:
        return null;
    }
  };

  const isAlertTriggered = (
    metric: MetricValue,
    threshold: number,
    inverse = false
  ) => {
    return inverse ? metric.value > threshold : metric.value < threshold;
  };

  const formatValue = (
    value: number,
    type: 'time' | 'percentage' | 'count'
  ) => {
    switch (type) {
      case 'time':
        return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
        return value >= 1000
          ? `${(value / 1000).toFixed(1)}k`
          : value.toString();
      default:
        return value.toString();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  return (
    <div className={clsx('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Metrics</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleLive}
            className={clsx(
              'flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors',
              isLive
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
            />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {metrics.map((apiMetrics) => (
          <div
            key={apiMetrics.apiId}
            onClick={() => onAPIClick?.(apiMetrics.apiId)}
            className={clsx(
              'bg-white rounded-lg border border-gray-200 p-6 transition-all',
              onAPIClick
                ? 'cursor-pointer hover:shadow-lg hover:border-blue-300'
                : 'cursor-default'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {apiMetrics.apiName}
              </h4>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatTimestamp(apiMetrics.lastUpdate)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Response Time</span>
                  </div>
                  {apiMetrics.responseTime.trend &&
                    getTrendIcon(apiMetrics.responseTime.trend)}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={clsx(
                      'text-lg font-semibold',
                      isAlertTriggered(
                        apiMetrics.responseTime,
                        alertThresholds.responseTime,
                        true
                      )
                        ? 'text-red-600'
                        : 'text-gray-900'
                    )}
                  >
                    {formatValue(apiMetrics.responseTime.value, 'time')}
                  </span>
                  {isAlertTriggered(
                    apiMetrics.responseTime,
                    alertThresholds.responseTime,
                    true
                  ) && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Uptime</span>
                  </div>
                  {apiMetrics.uptime.trend &&
                    getTrendIcon(apiMetrics.uptime.trend)}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={clsx(
                      'text-lg font-semibold',
                      isAlertTriggered(
                        apiMetrics.uptime,
                        alertThresholds.uptime
                      )
                        ? 'text-red-600'
                        : 'text-green-600'
                    )}
                  >
                    {formatValue(apiMetrics.uptime.value, 'percentage')}
                  </span>
                  {isAlertTriggered(
                    apiMetrics.uptime,
                    alertThresholds.uptime
                  ) && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Error Rate</span>
                  </div>
                  {apiMetrics.errorRate.trend &&
                    getTrendIcon(apiMetrics.errorRate.trend, true)}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={clsx(
                      'text-lg font-semibold',
                      isAlertTriggered(
                        apiMetrics.errorRate,
                        alertThresholds.errorRate,
                        true
                      )
                        ? 'text-red-600'
                        : 'text-gray-900'
                    )}
                  >
                    {formatValue(apiMetrics.errorRate.value, 'percentage')}
                  </span>
                  {isAlertTriggered(
                    apiMetrics.errorRate,
                    alertThresholds.errorRate,
                    true
                  ) && <Zap className="w-4 h-4 text-red-500" />}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Requests</span>
                  </div>
                  {apiMetrics.requestCount.trend &&
                    getTrendIcon(apiMetrics.requestCount.trend)}
                </div>
                <span className="text-lg font-semibold text-blue-600">
                  {formatValue(apiMetrics.requestCount.value, 'count')}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Health</span>
                <div className="flex items-center space-x-2">
                  {isAlertTriggered(
                    apiMetrics.responseTime,
                    alertThresholds.responseTime,
                    true
                  ) ||
                  isAlertTriggered(apiMetrics.uptime, alertThresholds.uptime) ||
                  isAlertTriggered(
                    apiMetrics.errorRate,
                    alertThresholds.errorRate,
                    true
                  ) ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-600">
                        Issues Detected
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium text-green-600">
                        Healthy
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {metrics.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Metrics Available
          </h3>
          <p className="text-gray-600">
            Start monitoring APIs to see real-time metrics.
          </p>
        </div>
      )}
    </div>
  );
};

interface LiveMetricsSummaryProps {
  metrics: APIMetrics[];
  className?: string;
}

export const LiveMetricsSummary: React.FC<LiveMetricsSummaryProps> = ({
  metrics,
  className = '',
}) => {
  const avgResponseTime =
    metrics.reduce((sum, m) => sum + m.responseTime.value, 0) / metrics.length;
  const avgUptime =
    metrics.reduce((sum, m) => sum + m.uptime.value, 0) / metrics.length;
  const avgErrorRate =
    metrics.reduce((sum, m) => sum + m.errorRate.value, 0) / metrics.length;
  const totalRequests = metrics.reduce(
    (sum, m) => sum + m.requestCount.value,
    0
  );

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-4',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Metrics Overview
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-lg font-semibold text-gray-900">
            {avgResponseTime < 1000
              ? `${avgResponseTime.toFixed(0)}ms`
              : `${(avgResponseTime / 1000).toFixed(1)}s`}
          </p>
          <p className="text-xs text-gray-600">Avg Response</p>
        </div>

        <div className="text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className="text-lg font-semibold text-gray-900">
            {avgUptime.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600">Avg Uptime</p>
        </div>

        <div className="text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="text-lg font-semibold text-gray-900">
            {avgErrorRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600">Avg Error Rate</p>
        </div>

        <div className="text-center">
          <BarChart3 className="w-6 h-6 mx-auto mb-2 text-purple-500" />
          <p className="text-lg font-semibold text-gray-900">
            {totalRequests >= 1000
              ? `${(totalRequests / 1000).toFixed(1)}k`
              : totalRequests}
          </p>
          <p className="text-xs text-gray-600">Total Requests</p>
        </div>
      </div>
    </div>
  );
};

export default LiveMetrics;
