'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface PerformanceDataPoint {
  timestamp: string;
  responseTime: number;
  uptime: number;
  errorRate: number;
  requestCount: number;
  date: string;
  hour: number;
}

interface APIPerformanceData {
  apiId: string;
  apiName: string;
  data: PerformanceDataPoint[];
  slaTarget?: {
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
}

interface APIPerformanceChartProps {
  apis: APIPerformanceData[];
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d' | '30d') => void;
  metric: 'responseTime' | 'uptime' | 'errorRate' | 'requestCount';
  onMetricChange: (metric: 'responseTime' | 'uptime' | 'errorRate' | 'requestCount') => void;
  chartType?: 'line' | 'area' | 'bar';
  className?: string;
  showSLA?: boolean;
  compareMode?: boolean;
  selectedAPIs?: string[];
  onAPISelection?: (apiIds: string[]) => void;
}

const APIPerformanceChart: React.FC<APIPerformanceChartProps> = ({
  apis,
  timeRange,
  onTimeRangeChange,
  metric,
  onMetricChange,
  chartType = 'line',
  className = '',
  showSLA = true,
  compareMode = false,
  selectedAPIs = [],
  onAPISelection,
}) => {
  const [showTooltip] = useState(true);

  // Color palette for multiple APIs
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
  ];

  // Filter and process data based on selections
  const chartData = useMemo(() => {
    const apisToShow = compareMode 
      ? apis.filter(api => selectedAPIs.includes(api.apiId))
      : apis.slice(0, 1); // Show only first API in single mode

    if (apisToShow.length === 0) return [];

    // Merge data points by timestamp for comparison
    const mergedData: any[] = [];
    const timePoints = new Set<string>();

    // Collect all unique timestamps
    apisToShow.forEach(api => {
      api.data.forEach(point => timePoints.add(point.timestamp));
    });

    // Create merged data points
    Array.from(timePoints).sort().forEach(timestamp => {
      const dataPoint: any = { timestamp };
      
      apisToShow.forEach((api) => {
        const point = api.data.find(p => p.timestamp === timestamp);
        if (point) {
          dataPoint[`${api.apiName}_${metric}`] = point[metric];
          dataPoint[`${api.apiName}_date`] = point.date;
          dataPoint[`${api.apiName}_hour`] = point.hour;
        } else {
          dataPoint[`${api.apiName}_${metric}`] = null;
        }
      });

      mergedData.push(dataPoint);
    });

    return mergedData;
  }, [apis, compareMode, selectedAPIs, metric]);

  // Get metric configuration
  const getMetricConfig = () => {
    switch (metric) {
      case 'responseTime':
        return {
          label: 'Response Time',
          unit: 'ms',
          color: '#3B82F6',
          icon: Clock,
          format: (value: number) => `${value}ms`,
          threshold: apis[0]?.slaTarget?.responseTime,
        };
      case 'uptime':
        return {
          label: 'Uptime',
          unit: '%',
          color: '#10B981',
          icon: TrendingUp,
          format: (value: number) => `${value.toFixed(1)}%`,
          threshold: apis[0]?.slaTarget?.uptime,
        };
      case 'errorRate':
        return {
          label: 'Error Rate',
          unit: '%',
          color: '#EF4444',
          icon: AlertTriangle,
          format: (value: number) => `${value.toFixed(2)}%`,
          threshold: apis[0]?.slaTarget?.errorRate,
        };
      case 'requestCount':
        return {
          label: 'Request Count',
          unit: '',
          color: '#8B5CF6',
          icon: BarChart3,
          format: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString(),
          threshold: undefined,
        };
      default:
        return {
          label: 'Metric',
          unit: '',
          color: '#6B7280',
          icon: Activity,
          format: (value: number) => value.toString(),
          threshold: undefined,
        };
    }
  };

  const config = getMetricConfig();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !showTooltip) return null;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600 mb-2">
          {new Date(label).toLocaleString()}
        </p>
        {payload.map((entry: any, index: number) => {
          const apiName = entry.dataKey.replace(`_${metric}`, '');
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-gray-900">
                {apiName}: {config.format(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Time range options
  const timeRangeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  // Metric options
  const metricOptions = [
    { value: 'responseTime', label: 'Response Time', icon: Clock },
    { value: 'uptime', label: 'Uptime', icon: TrendingUp },
    { value: 'errorRate', label: 'Error Rate', icon: AlertTriangle },
    { value: 'requestCount', label: 'Request Count', icon: BarChart3 },
  ];

  // Calculate trend
  const calculateTrend = (data: PerformanceDataPoint[]) => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = data.slice(-5).reduce((sum, point) => sum + point[metric], 0) / 5;
    const previous = data.slice(-10, -5).reduce((sum, point) => sum + point[metric], 0) / 5;
    
    const change = ((recent - previous) / previous) * 100;
    const direction = Math.abs(change) < 1 ? 'stable' : change > 0 ? 'up' : 'down';
    
    return { direction, percentage: Math.abs(change) };
  };

  // Render chart based on type
  const renderChart = () => {
    const apisToShow = compareMode 
      ? apis.filter(api => selectedAPIs.includes(api.apiId))
      : apis.slice(0, 1);

    switch (chartType) {
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis tickFormatter={config.format} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {apisToShow.map((api, index) => (
              <Area
                key={api.apiId}
                type="monotone"
                dataKey={`${api.apiName}_${metric}`}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
            {showSLA && config.threshold && (
              <ReferenceLine 
                y={config.threshold} 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                label={{ value: "SLA Target", position: "top" }}
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis tickFormatter={config.format} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {apisToShow.map((api, index) => (
              <Bar
                key={api.apiId}
                dataKey={`${api.apiName}_${metric}`}
                fill={colors[index % colors.length]}
              />
            ))}
            {showSLA && config.threshold && (
              <ReferenceLine 
                y={config.threshold} 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                label={{ value: "SLA Target", position: "top" }}
              />
            )}
          </BarChart>
        );

      default: // line
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis tickFormatter={config.format} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {apisToShow.map((api, index) => (
              <Line
                key={api.apiId}
                type="monotone"
                dataKey={`${api.apiName}_${metric}`}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
            {showSLA && config.threshold && (
              <ReferenceLine 
                y={config.threshold} 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                label={{ value: "SLA Target", position: "top" }}
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <config.icon className="w-6 h-6 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              API Performance - {config.label}
            </h3>
            <p className="text-sm text-gray-600">
              {compareMode ? `Comparing ${selectedAPIs.length} APIs` : apis[0]?.apiName}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Compare Mode Toggle */}
          {apis.length > 1 && (
            <button
              onClick={() => {
                // Toggle compare mode logic would go here
                if (onAPISelection && !compareMode) {
                  onAPISelection(apis.slice(0, 2).map(api => api.apiId));
                }
              }}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm transition-colors',
                compareMode
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Compare
            </button>
          )}

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Metric Selector */}
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      {!compareMode && apis.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {apis.slice(0, 1).map((api) => {
            const trend = calculateTrend(api.data);
            const latest = api.data[api.data.length - 1];
            
            return (
              <div key={api.apiId} className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {latest ? config.format(latest[metric]) : 'N/A'}
                  </span>
                  {trend.direction !== 'stable' && (
                    <div className="flex items-center space-x-1">
                      {trend.direction === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={clsx(
                        'text-xs',
                        trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {trend.percentage.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600">Current {config.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* API Selection for Compare Mode */}
      {compareMode && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Select APIs to Compare</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {apis.map((api, index) => (
              <label
                key={api.apiId}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAPIs.includes(api.apiId)}
                  onChange={(e) => {
                    if (onAPISelection) {
                      if (e.target.checked) {
                        onAPISelection([...selectedAPIs, api.apiId]);
                      } else {
                        onAPISelection(selectedAPIs.filter(id => id !== api.apiId));
                      }
                    }
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-700 truncate">{api.apiName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {chartData.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">
            {compareMode 
              ? 'Select APIs to compare their performance metrics.'
              : 'Performance data will appear here once monitoring begins.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default APIPerformanceChart;
