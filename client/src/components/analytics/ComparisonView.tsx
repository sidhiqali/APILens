'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Radar as RadarIcon,
  Target as ScatterIcon,
  Filter,
  Download,
  Share2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ComparisonData {
  apiId: string;
  apiName: string;
  category: string;
  metrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    requestCount: number;
    reliability: number;
    performance: number;
    availability: number;
  };
  color: string;
  trend: 'up' | 'down' | 'stable';
  healthScore: number;
}

interface ComparisonViewProps {
  data: ComparisonData[];
  selectedMetrics: string[];
  onMetricToggle: (metric: string) => void;
  viewType: 'bar' | 'line' | 'radar' | 'scatter';
  onViewTypeChange: (type: 'bar' | 'line' | 'radar' | 'scatter') => void;
  className?: string;
  showCategories?: boolean;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  data,
  selectedMetrics,
  onMetricToggle,
  viewType,
  onViewTypeChange,
  className = '',
  showCategories = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('healthScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);

  const processedData = useMemo(() => {
    let filteredData = [...data];

    if (selectedCategory !== 'all') {
      filteredData = filteredData.filter(
        (api) => api.category === selectedCategory
      );
    }

    if (showOnlyIssues) {
      filteredData = filteredData.filter(
        (api) =>
          api.metrics.uptime < 99 ||
          api.metrics.errorRate > 1 ||
          api.metrics.responseTime > 1000 ||
          api.healthScore < 80
      );
    }

    filteredData.sort((a, b) => {
      let aValue: number, bValue: number;

      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.apiName.localeCompare(b.apiName)
          : b.apiName.localeCompare(a.apiName);
      }

      if (sortBy === 'healthScore') {
        aValue = a.healthScore;
        bValue = b.healthScore;
      } else {
        aValue = a.metrics[sortBy as keyof typeof a.metrics] as number;
        bValue = b.metrics[sortBy as keyof typeof b.metrics] as number;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filteredData;
  }, [data, selectedCategory, sortBy, sortOrder, showOnlyIssues]);

  const chartData = useMemo(() => {
    if (viewType === 'radar') {
      const subjects = [
        'Response Time',
        'Uptime',
        'Error Rate',
        'Reliability',
        'Performance',
        'Availability',
      ];
      const radarData = subjects.map((subject) => {
        const dataPoint: any = { subject };
        processedData.forEach((api) => {
          let value;
          switch (subject) {
            case 'Response Time':
              value = Math.max(0, 100 - api.metrics.responseTime / 10);
              break;
            case 'Uptime':
              value = api.metrics.uptime;
              break;
            case 'Error Rate':
              value = Math.max(0, 100 - api.metrics.errorRate);
              break;
            case 'Reliability':
              value = api.metrics.reliability;
              break;
            case 'Performance':
              value = api.metrics.performance;
              break;
            case 'Availability':
              value = api.metrics.availability;
              break;
            default:
              value = 0;
          }
          dataPoint[api.apiName] = value;
        });
        return dataPoint;
      });
      return radarData;
    }

    if (viewType === 'scatter') {
      return processedData.map((api) => ({
        x: api.metrics.responseTime,
        y: api.metrics.uptime,
        z: api.metrics.requestCount,
        name: api.apiName,
        category: api.category,
        fill: api.color,
        healthScore: api.healthScore,
      }));
    }

    return processedData.map((api) => ({
      name: api.apiName,
      category: api.category,
      ...api.metrics,
      healthScore: api.healthScore,
      fill: api.color,
    }));
  }, [processedData, viewType]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(data.map((api) => api.category))
    );
    return ['all', ...uniqueCategories];
  }, [data]);

  const availableMetrics = [
    { key: 'responseTime', label: 'Response Time', unit: 'ms', icon: Clock },
    { key: 'uptime', label: 'Uptime', unit: '%', icon: TrendingUp },
    { key: 'errorRate', label: 'Error Rate', unit: '%', icon: AlertTriangle },
    { key: 'requestCount', label: 'Requests', unit: '', icon: BarChart3 },
    {
      key: 'reliability',
      label: 'Reliability',
      unit: '/100',
      icon: CheckCircle,
    },
    { key: 'performance', label: 'Performance', unit: '/100', icon: Activity },
    {
      key: 'availability',
      label: 'Availability',
      unit: '/100',
      icon: TrendingUp,
    },
  ];

  const viewOptions = [
    { type: 'bar', label: 'Bar Chart', icon: BarChart },
    { type: 'line', label: 'Line Chart', icon: TrendingUp },
    { type: 'radar', label: 'Radar Chart', icon: RadarIcon },
    { type: 'scatter', label: 'Scatter Plot', icon: ScatterIcon },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.dataKey}:</span>
            <span className="font-medium">
              {typeof entry.value === 'number'
                ? entry.value.toFixed(2)
                : entry.value}
              {entry.dataKey === 'responseTime' && 'ms'}
              {(entry.dataKey === 'uptime' || entry.dataKey === 'errorRate') &&
                '%'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const chartHeight = 400;

    switch (viewType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RadarChart
              data={chartData}
              margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
            >
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis dataKey="subject" fontSize={12} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                fontSize={10}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {processedData.slice(0, 5).map((api, index) => (
                <Radar
                  key={index}
                  name={api.apiName}
                  dataKey={api.apiName}
                  stroke={api.color}
                  fill={api.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                dataKey="x"
                name="Response Time"
                unit="ms"
                fontSize={12}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Uptime"
                unit="%"
                fontSize={12}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900 mb-2">
                        {data.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Response Time: {data.x}ms
                      </p>
                      <p className="text-sm text-gray-600">Uptime: {data.y}%</p>
                      <p className="text-sm text-gray-600">
                        Requests: {data.z?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Health Score: {data.healthScore}/100
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-yellow-600 bg-yellow-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
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
          <GitCompare className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              API Comparison
            </h3>
            <p className="text-sm text-gray-600">
              Compare performance across multiple APIs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => onViewTypeChange(option.type as any)}
                  className={clsx(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    viewType === option.type
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-3 h-3 mr-1 inline" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {showCategories && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="healthScore">Health Score</option>
            <option value="responseTime">Response Time</option>
            <option value="uptime">Uptime</option>
            <option value="errorRate">Error Rate</option>
            <option value="name">Name</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyIssues}
            onChange={(e) => setShowOnlyIssues(e.target.checked)}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">Show only issues</span>
        </label>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Select Metrics to Compare:
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableMetrics.map((metric) => {
            const Icon = metric.icon;
            const isSelected = selectedMetrics.includes(metric.key);

            return (
              <button
                key={metric.key}
                onClick={() => onMetricToggle(metric.key)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4 mr-1 inline" />
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        {selectedMetrics.length > 0 ? (
          renderChart()
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Metrics to Compare
            </h3>
            <p className="text-gray-600">
              Choose one or more metrics above to visualize the comparison.
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                API
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Health Score
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Trend
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Response Time
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Uptime
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Error Rate
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Requests
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((api) => (
              <tr
                key={api.apiId}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: api.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {api.apiName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {api.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getHealthScoreColor(api.healthScore)
                    )}
                  >
                    {api.healthScore}/100
                  </span>
                </td>
                <td className="py-3 px-4">{getTrendIcon(api.trend)}</td>
                <td className="py-3 px-4">{api.metrics.responseTime}ms</td>
                <td className="py-3 px-4">{api.metrics.uptime}%</td>
                <td className="py-3 px-4">{api.metrics.errorRate}%</td>
                <td className="py-3 px-4">
                  {api.metrics.requestCount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {processedData.length === 0 && (
        <div className="text-center py-8">
          <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No APIs Match Filters
          </h3>
          <p className="text-gray-600">
            Adjust your filters to see API comparisons.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;
