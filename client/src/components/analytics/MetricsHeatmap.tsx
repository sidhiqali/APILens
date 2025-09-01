'use client';

import React, { useMemo, useState } from 'react';
import {
  Clock,
  TrendingUp,
  Download,
  RotateCcw,
  Thermometer,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface HeatmapDataPoint {
  timestamp: string;
  hour: number;
  day: number;
  value: number;
  label: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface HeatmapCell {
  row: number;
  col: number;
  value: number;
  count: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  dataPoints: HeatmapDataPoint[];
  rowLabel: string;
  colLabel: string;
}

interface MetricsHeatmapData {
  apiId: string;
  apiName: string;
  metric:
    | 'responseTime'
    | 'uptime'
    | 'errorRate'
    | 'requestCount'
    | 'cpuUsage'
    | 'memoryUsage';
  data: HeatmapDataPoint[];
  timeRange: '24h' | '7d' | '30d';
  aggregation: 'hourly' | 'daily' | 'weekly';
}

interface MetricsHeatmapProps {
  data: MetricsHeatmapData[];
  selectedMetric:
    | 'responseTime'
    | 'uptime'
    | 'errorRate'
    | 'requestCount'
    | 'cpuUsage'
    | 'memoryUsage';
  onMetricChange: (
    metric:
      | 'responseTime'
      | 'uptime'
      | 'errorRate'
      | 'requestCount'
      | 'cpuUsage'
      | 'memoryUsage'
  ) => void;
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
  className?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  cellSize?: 'small' | 'medium' | 'large';
}

const MetricsHeatmap: React.FC<MetricsHeatmapProps> = ({
  data,
  selectedMetric,
  onMetricChange,
  timeRange,
  onTimeRangeChange,
  className = '',
  showLegend = true,
  showTooltip = true,
  cellSize = 'medium',
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [selectedApi, setSelectedApi] = useState<string>('all');

  const filteredData = useMemo(() => {
    return data.filter(
      (apiData) =>
        (selectedApi === 'all' || apiData.apiId === selectedApi) &&
        apiData.metric === selectedMetric &&
        apiData.timeRange === timeRange
    );
  }, [data, selectedApi, selectedMetric, timeRange]);

  const heatmapGrid = useMemo(() => {
    if (filteredData.length === 0)
      return { grid: [], maxValue: 0, minValue: 0 };

    const allDataPoints = filteredData.flatMap((apiData) => apiData.data);

    let rows: number,
      cols: number,
      getRowLabel: (index: number) => string,
      getColLabel: (index: number) => string;

    if (timeRange === '24h') {
      rows = 24;
      cols = 1;
      getRowLabel = (hour) => `${hour.toString().padStart(2, '0')}:00`;
      getColLabel = () => 'Today';
    } else if (timeRange === '7d') {
      rows = 24;
      cols = 7;
      getRowLabel = (hour) => `${hour.toString().padStart(2, '0')}:00`;
      getColLabel = (day) => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[day];
      };
    } else {
      rows = 7;
      cols = Math.ceil(30 / 7);
      getRowLabel = (day) => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[day];
      };
      getColLabel = (week) => `Week ${week + 1}`;
    }

    const grid = Array(rows)
      .fill(null)
      .map((_, row) =>
        Array(cols)
          .fill(null)
          .map((_, col) => {
            const cellData = allDataPoints.filter((point) => {
              if (timeRange === '24h') {
                return point.hour === row;
              } else if (timeRange === '7d') {
                return point.hour === row && point.day === col;
              } else {
                const weekDay = point.day % 7;
                const week = Math.floor(point.day / 7);
                return weekDay === row && week === col;
              }
            });

            if (cellData.length === 0) {
              return {
                row,
                col,
                value: 0,
                count: 0,
                status: 'good' as const,
                dataPoints: [],
                rowLabel: getRowLabel(row),
                colLabel: getColLabel(col),
              };
            }

            const avgValue =
              cellData.reduce((sum, point) => sum + point.value, 0) /
              cellData.length;
            const statuses = cellData.map((point) => point.status);
            const worstStatus: 'excellent' | 'good' | 'warning' | 'critical' =
              statuses.includes('critical')
                ? 'critical'
                : statuses.includes('warning')
                  ? 'warning'
                  : statuses.includes('good')
                    ? 'good'
                    : 'excellent';

            return {
              row,
              col,
              value: avgValue,
              count: cellData.length,
              status: worstStatus,
              dataPoints: cellData,
              rowLabel: getRowLabel(row),
              colLabel: getColLabel(col),
            };
          })
      );

    const values = grid
      .flat()
      .map((cell) => cell.value)
      .filter((v) => v > 0);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    return { grid, maxValue, minValue, rows, cols };
  }, [filteredData, timeRange]);

  const availableApis = useMemo(() => {
    const apis = Array.from(
      new Set(data.map((d) => ({ id: d.apiId, name: d.apiName })))
    );
    return [{ id: 'all', name: 'All APIs' }, ...apis];
  }, [data]);

  const metricOptions = [
    { key: 'responseTime', label: 'Response Time', unit: 'ms', icon: Clock },
    { key: 'uptime', label: 'Uptime', unit: '%', icon: TrendingUp },
    { key: 'errorRate', label: 'Error Rate', unit: '%', icon: AlertTriangle },
    { key: 'requestCount', label: 'Request Count', unit: '', icon: Activity },
    { key: 'cpuUsage', label: 'CPU Usage', unit: '%', icon: Thermometer },
    { key: 'memoryUsage', label: 'Memory Usage', unit: '%', icon: Thermometer },
  ];

  const timeRangeOptions = [
    { key: '24h', label: 'Last 24 Hours' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
  ];

  const getCellColor = (value: number, status: string) => {
    if (value === 0) return 'bg-gray-100';

    const intensity = Math.min(value / heatmapGrid.maxValue, 1);

    if (selectedMetric === 'uptime') {
      return clsx(
        status === 'critical' && 'bg-red-500',
        status === 'warning' && 'bg-orange-400',
        status === 'good' && 'bg-green-400',
        status === 'excellent' && 'bg-green-500'
      );
    } else if (selectedMetric === 'errorRate') {
      return clsx(
        status === 'excellent' && 'bg-green-500',
        status === 'good' && 'bg-green-400',
        status === 'warning' && 'bg-orange-400',
        status === 'critical' && 'bg-red-500'
      );
    } else if (selectedMetric === 'responseTime') {
      return status === 'critical'
        ? 'bg-red-500'
        : status === 'warning'
          ? 'bg-orange-400'
          : status === 'good'
            ? 'bg-yellow-400'
            : 'bg-green-500';
    } else {
      const opacity = Math.max(0.3, intensity);
      return clsx(
        'bg-blue-500',
        opacity < 0.3 && 'bg-opacity-30',
        opacity < 0.6 && opacity >= 0.3 && 'bg-opacity-60',
        opacity >= 0.6 && 'bg-opacity-90'
      );
    }
  };

  const getCellSizeClasses = () => {
    switch (cellSize) {
      case 'small':
        return 'w-6 h-6';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const formatValue = (value: number, metric: string) => {
    if (value === 0) return '—';

    switch (metric) {
      case 'responseTime':
        return `${value.toFixed(0)}ms`;
      case 'uptime':
      case 'errorRate':
      case 'cpuUsage':
      case 'memoryUsage':
        return `${value.toFixed(1)}%`;
      case 'requestCount':
        return value >= 1000
          ? `${(value / 1000).toFixed(1)}k`
          : value.toFixed(0);
      default:
        return value.toFixed(2);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-3 h-3 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Thermometer className="w-6 h-6 text-orange-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Heatmap
            </h3>
            <p className="text-sm text-gray-600">
              Visualize performance patterns over time
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-100">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-100">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 mb-6 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Metric:</span>
          <select
            value={selectedMetric}
            onChange={(e) => onMetricChange(e.target.value as any)}
            className="px-3 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            {metricOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
            className="px-3 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">API:</span>
          <select
            value={selectedApi}
            onChange={(e) => setSelectedApi(e.target.value)}
            className="px-3 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            {availableApis.map((api) => (
              <option key={api.id} value={api.id}>
                {api.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {heatmapGrid.grid.length > 0 ? (
        <div className="relative">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex mb-2">
                <div className="flex-shrink-0 w-16" />{' '}
                {Array(heatmapGrid.cols)
                  .fill(null)
                  .map((_, col) => (
                    <div
                      key={col}
                      className={clsx(
                        'text-center text-xs font-medium text-gray-600 mx-0.5',
                        getCellSizeClasses()
                      )}
                    >
                      {heatmapGrid.grid[0][col].colLabel}
                    </div>
                  ))}
              </div>

              {heatmapGrid.grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center mb-1">
                  <div className="flex-shrink-0 w-16 pr-2 text-xs font-medium text-right text-gray-600">
                    {row[0].rowLabel}
                  </div>

                  {row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={clsx(
                        'mx-0.5 rounded cursor-pointer transition-all duration-200 border border-gray-200',
                        getCellSizeClasses(),
                        getCellColor(cell.value, cell.status),
                        hoveredCell === cell && 'ring-2 ring-gray-400 scale-110'
                      )}
                      onMouseEnter={() => showTooltip && setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {showTooltip && hoveredCell && (
            <div className="absolute z-10 p-3 bg-white border border-gray-200 rounded-lg shadow-lg pointer-events-none">
              <div className="flex items-center mb-2 space-x-2">
                {getStatusIcon(hoveredCell.status)}
                <span className="font-semibold text-gray-900">
                  {hoveredCell.rowLabel} - {hoveredCell.colLabel}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  Value: {formatValue(hoveredCell.value, selectedMetric)}
                </div>
                <div>Status: {hoveredCell.status}</div>
                <div>Data Points: {hoveredCell.count}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center rounded-lg bg-gray-50">
          <Thermometer className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No Data Available
          </h3>
          <p className="text-gray-600">
            No heatmap data found for the selected metric and time range.
          </p>
        </div>
      )}

      {showLegend && heatmapGrid.grid.length > 0 && (
        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">Legend</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded" />
                  <span className="text-xs text-gray-600">No data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-xs text-gray-600">Excellent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-400 rounded" />
                  <span className="text-xs text-gray-600">Good</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-400 rounded" />
                  <span className="text-xs text-gray-600">Warning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-xs text-gray-600">Critical</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-600">Range</div>
              <div className="text-sm font-medium text-gray-900">
                {formatValue(heatmapGrid.minValue, selectedMetric)} -{' '}
                {formatValue(heatmapGrid.maxValue, selectedMetric)}
              </div>
            </div>
          </div>
        </div>
      )}

      {heatmapGrid.grid.length > 0 && heatmapGrid.rows && heatmapGrid.cols && (
        <div className="grid grid-cols-4 gap-4 mt-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Total Cells</div>
            <div className="text-sm font-semibold text-gray-900">
              {heatmapGrid.rows * heatmapGrid.cols}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">With Data</div>
            <div className="text-sm font-semibold text-gray-900">
              {heatmapGrid.grid.flat().filter((cell) => cell.count > 0).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Critical</div>
            <div className="text-sm font-semibold text-red-600">
              {
                heatmapGrid.grid
                  .flat()
                  .filter((cell) => cell.status === 'critical').length
              }
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Peak Value</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatValue(heatmapGrid.maxValue, selectedMetric)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsHeatmap;
