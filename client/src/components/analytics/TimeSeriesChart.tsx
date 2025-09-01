'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  ZoomIn,
  RotateCcw,
  Download,
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  Target,
  Activity,
} from 'lucide-react';
import { clsx } from 'clsx';

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  date: string;
  formattedTime: string;
  anomaly?: boolean;
  prediction?: boolean;
  confidence?: number;
}

interface TimeSeriesData {
  apiId: string;
  apiName: string;
  metric:
    | 'responseTime'
    | 'uptime'
    | 'errorRate'
    | 'requestCount'
    | 'cpuUsage'
    | 'memoryUsage';
  data: TimeSeriesDataPoint[];
  color: string;
  unit: string;
  thresholds?: {
    warning: number;
    critical: number;
    target?: number;
  };
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  selectedApis: string[];
  onApiToggle: (apiId: string) => void;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d' | '30d') => void;
  chartType: 'line' | 'area';
  onChartTypeChange: (type: 'line' | 'area') => void;
  className?: string;
  showAnomalies?: boolean;
  showPredictions?: boolean;
  showThresholds?: boolean;
  enableBrush?: boolean;
  enableZoom?: boolean;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  selectedApis,
  onApiToggle,
  timeRange,
  onTimeRangeChange,
  chartType,
  onChartTypeChange,
  className = '',
  showAnomalies = true,
  showPredictions = true,
  showThresholds = true,
  enableBrush = true,
  enableZoom = true,
}) => {
  const [zoomDomain, setZoomDomain] = useState<[string, string] | null>(null);

  const chartData = useMemo(() => {
    const filteredData = data.filter((apiData) =>
      selectedApis.includes(apiData.apiId)
    );

    if (filteredData.length === 0) return [];

    const allTimestamps = Array.from(
      new Set(
        filteredData.flatMap((apiData) =>
          apiData.data.map((point) => point.timestamp)
        )
      )
    ).sort();

    return allTimestamps.map((timestamp) => {
      const dataPoint: any = { timestamp };

      filteredData.forEach((apiData) => {
        const point = apiData.data.find((p) => p.timestamp === timestamp);
        if (point) {
          dataPoint[apiData.apiId] = point.value;
          dataPoint[`${apiData.apiId}_anomaly`] = point.anomaly;
          dataPoint[`${apiData.apiId}_prediction`] = point.prediction;
          dataPoint[`${apiData.apiId}_confidence`] = point.confidence;
          dataPoint.formattedTime = point.formattedTime;
          dataPoint.date = point.date;
        }
      });

      return dataPoint;
    });
  }, [data, selectedApis]);

  const selectedApiData = useMemo(() => {
    return data.filter((apiData) => selectedApis.includes(apiData.apiId));
  }, [data, selectedApis]);

  const statistics = useMemo(() => {
    const stats: Record<string, any> = {};

    selectedApiData.forEach((apiData) => {
      const values = apiData.data.map((point) => point.value);
      const anomalies = apiData.data.filter((point) => point.anomaly).length;
      const predictions = apiData.data.filter(
        (point) => point.prediction
      ).length;

      stats[apiData.apiId] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        current: values[values.length - 1] || 0,
        anomalies,
        predictions,
        trend:
          values.length > 1
            ? ((values[values.length - 1] - values[0]) / values[0]) * 100
            : 0,
      };
    });

    return stats;
  }, [selectedApiData]);

  const timeRangeOptions = [
    { key: '1h', label: 'Last Hour' },
    { key: '6h', label: 'Last 6 Hours' },
    { key: '24h', label: 'Last 24 Hours' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="font-semibold text-gray-900 mb-2">
          {dataPoint.formattedTime}
        </div>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const apiData = selectedApiData.find(
              (api) => api.apiId === entry.dataKey
            );
            if (!apiData) return null;

            const isAnomaly = dataPoint[`${entry.dataKey}_anomaly`];
            const isPrediction = dataPoint[`${entry.dataKey}_prediction`];
            const confidence = dataPoint[`${entry.dataKey}_confidence`];

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {apiData.apiName}:
                  </span>
                  {isAnomaly && (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                  {isPrediction && <Target className="w-3 h-3 text-blue-500" />}
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">
                    {typeof entry.value === 'number'
                      ? entry.value.toFixed(2)
                      : entry.value}
                    {apiData.unit}
                  </span>
                  {confidence && (
                    <div className="text-xs text-gray-500">
                      {confidence.toFixed(0)}% confidence
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleZoom = (domain: any) => {
    if (domain) {
      setZoomDomain([domain.startIndex, domain.endIndex]);
    } else {
      setZoomDomain(null);
    }
  };

  const handleBrush = (_domain: any) => {
    // Intentionally silent in production; enable if needed for debugging
  };

  const resetZoom = () => {
    setZoomDomain(null);
  };

  const formatValue = (value: number, unit: string) => {
    if (typeof value !== 'number') return '—';

    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === '' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return `${value.toFixed(2)}${unit}`;
  };

  const renderChart = () => {
    const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onMouseDown={enableZoom ? handleZoom : undefined}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="formattedTime"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
            domain={zoomDomain ? zoomDomain : ['dataMin', 'dataMax']}
          />
          <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {showThresholds &&
            selectedApiData.map((apiData) => {
              if (!apiData.thresholds) return null;

              return (
                <g key={`thresholds-${apiData.apiId}`}>
                  {apiData.thresholds.warning && (
                    <ReferenceLine
                      y={apiData.thresholds.warning}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      label="Warning"
                    />
                  )}
                  {apiData.thresholds.critical && (
                    <ReferenceLine
                      y={apiData.thresholds.critical}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      label="Critical"
                    />
                  )}
                  {apiData.thresholds.target && (
                    <ReferenceLine
                      y={apiData.thresholds.target}
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      label="Target"
                    />
                  )}
                </g>
              );
            })}

          {selectedApiData.map((apiData) => {
            if (chartType === 'area') {
              return (
                <Area
                  key={apiData.apiId}
                  type="monotone"
                  dataKey={apiData.apiId}
                  stroke={apiData.color}
                  fill={apiData.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: apiData.color, strokeWidth: 2 }}
                  name={apiData.apiName}
                />
              );
            } else {
              return (
                <Line
                  key={apiData.apiId}
                  type="monotone"
                  dataKey={apiData.apiId}
                  stroke={apiData.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: apiData.color, strokeWidth: 2 }}
                  name={apiData.apiName}
                />
              );
            }
          })}

          {enableBrush && (
            <Brush
              dataKey="formattedTime"
              height={30}
              stroke="#8884d8"
              onChange={handleBrush}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
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
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Time Series Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Monitor performance trends over time
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {enableZoom && (
            <>
              <button
                onClick={resetZoom}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => onChartTypeChange('line')}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              Line
            </button>
            <button
              onClick={() => onChartTypeChange('area')}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                chartType === 'area'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              Area
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Range:</span>
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={() => {
              }}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Anomalies</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPredictions}
              onChange={() => {
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Predictions</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showThresholds}
              onChange={() => {
              }}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Thresholds</span>
          </label>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Select APIs:
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.map((apiData) => {
            const isSelected = selectedApis.includes(apiData.apiId);
            const stats = statistics[apiData.apiId];

            return (
              <button
                key={apiData.apiId}
                onClick={() => onApiToggle(apiData.apiId)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center space-x-2',
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: apiData.color }}
                />
                <span>{apiData.apiName}</span>
                {isSelected ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {stats && (
                  <span className="text-xs text-gray-500">
                    {formatValue(stats.current, apiData.unit)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedApis.length > 0 ? (
        <div className="mb-6">{renderChart()}</div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select APIs to Visualize
          </h3>
          <p className="text-gray-600">
            Choose one or more APIs above to view their time series data.
          </p>
        </div>
      )}

      {selectedApis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedApiData.map((apiData) => {
            const stats = statistics[apiData.apiId];
            if (!stats) return null;

            return (
              <div key={apiData.apiId} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: apiData.color }}
                  />
                  <h4 className="font-semibold text-gray-900">
                    {apiData.apiName}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Current:</span>
                    <span className="font-medium ml-1">
                      {formatValue(stats.current, apiData.unit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Average:</span>
                    <span className="font-medium ml-1">
                      {formatValue(stats.avg, apiData.unit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Min:</span>
                    <span className="font-medium ml-1">
                      {formatValue(stats.min, apiData.unit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max:</span>
                    <span className="font-medium ml-1">
                      {formatValue(stats.max, apiData.unit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Trend:</span>
                    <span
                      className={clsx(
                        'font-medium ml-1',
                        stats.trend > 0
                          ? 'text-red-600'
                          : stats.trend < 0
                            ? 'text-green-600'
                            : 'text-gray-600'
                      )}
                    >
                      {stats.trend > 0 ? '+' : ''}
                      {stats.trend.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Anomalies:</span>
                    <span className="font-medium ml-1 text-red-600">
                      {stats.anomalies}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimeSeriesChart;
