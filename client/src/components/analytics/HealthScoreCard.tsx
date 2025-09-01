'use client';

import React, { useMemo } from 'react';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Shield,
  Target,
  ThermometerSun,
  Gauge,
} from 'lucide-react';
import { clsx } from 'clsx';

interface HealthMetric {
  name: string;
  value: number;
  weight: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  target: number;
  description: string;
}

interface HealthScoreData {
  apiId: string;
  apiName: string;
  overallScore: number;
  previousScore?: number;
  metrics: HealthMetric[];
  lastUpdated: string;
  recommendations: string[];
  category: string;
  slaCompliance: number;
}

interface HealthScoreCardProps {
  data: HealthScoreData;
  className?: string;
  showDetails?: boolean;
  onDetailsToggle?: () => void;
  size?: 'small' | 'medium' | 'large';
  showTrends?: boolean;
  showRecommendations?: boolean;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  data,
  className = '',
  showDetails = false,
  onDetailsToggle,
  size = 'medium',
  showTrends = true,
  showRecommendations = true,
}) => {
  const scoreBreakdown = useMemo(() => {
    const totalWeight = data.metrics.reduce(
      (sum, metric) => sum + metric.weight,
      0
    );
    const weightedScore = data.metrics.reduce(
      (sum, metric) => sum + metric.value * metric.weight,
      0
    );
    const calculatedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    const breakdown = data.metrics.map((metric) => ({
      ...metric,
      contribution: ((metric.value * metric.weight) / totalWeight) * 100,
      normalizedWeight: (metric.weight / totalWeight) * 100,
    }));

    return {
      calculated: calculatedScore,
      breakdown,
      variance: Math.abs(calculatedScore - data.overallScore),
    };
  }, [data.metrics, data.overallScore]);

  const getScoreStatus = (score: number) => {
    if (score >= 90)
      return { status: 'excellent', color: 'green', label: 'Excellent' };
    if (score >= 80) return { status: 'good', color: 'blue', label: 'Good' };
    if (score >= 70)
      return { status: 'warning', color: 'yellow', label: 'Warning' };
    return { status: 'critical', color: 'red', label: 'Critical' };
  };

  const scoreChange = useMemo(() => {
    if (!data.previousScore) return null;
    const change = data.overallScore - data.previousScore;
    return {
      value: change,
      percentage: (change / data.previousScore) * 100,
      isPositive: change > 0,
      isSignificant: Math.abs(change) >= 5,
    };
  }, [data.overallScore, data.previousScore]);

  const scoreStatus = getScoreStatus(data.overallScore);

  const getMetricIcon = (metricName: string) => {
    const name = metricName.toLowerCase();
    if (name.includes('response') || name.includes('latency')) return Clock;
    if (name.includes('uptime') || name.includes('availability'))
      return TrendingUp;
    if (name.includes('error') || name.includes('failure'))
      return AlertTriangle;
    if (name.includes('throughput') || name.includes('requests'))
      return Activity;
    if (name.includes('cpu') || name.includes('memory')) return ThermometerSun;
    if (name.includes('security') || name.includes('auth')) return Shield;
    if (name.includes('performance')) return Zap;
    return Gauge;
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-4';
      case 'large':
        return 'p-8';
      default:
        return 'p-6';
    }
  };

  const CircularProgress = ({
    score,
    size = 80,
  }: {
    score: number;
    size?: number;
  }) => {
    const circumference = 2 * Math.PI * (size / 2 - 8);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 8}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 8}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={clsx(
              'transition-all duration-1000 ease-out',
              scoreStatus.status === 'excellent' && 'text-green-500',
              scoreStatus.status === 'good' && 'text-blue-500',
              scoreStatus.status === 'warning' && 'text-yellow-500',
              scoreStatus.status === 'critical' && 'text-red-500'
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">
            {Math.round(score)}
          </span>
        </div>
      </div>
    );
  };

  const MetricBar = ({
    metric,
  }: {
    metric: HealthMetric & { contribution: number; normalizedWeight: number };
  }) => {
    const Icon = getMetricIcon(metric.name);
    const progress = (metric.value / 100) * 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {metric.name}
            </span>
            {showTrends && (
              <div className="flex items-center">
                {metric.trend === 'up' && (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                )}
                {metric.trend === 'down' && (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                {metric.trend === 'stable' && (
                  <Activity className="w-3 h-3 text-gray-600" />
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">
              {metric.value.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">/{metric.target}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-500',
              metric.status === 'excellent' && 'bg-green-500',
              metric.status === 'good' && 'bg-blue-500',
              metric.status === 'warning' && 'bg-yellow-500',
              metric.status === 'critical' && 'bg-red-500'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{metric.description}</span>
          <span>{metric.normalizedWeight.toFixed(1)}% weight</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border transition-all duration-200',
        getStatusColors(scoreStatus.status),
        getSizeClasses(),
        className,
        onDetailsToggle && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onDetailsToggle}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Heart
            className={clsx(
              'w-6 h-6',
              scoreStatus.status === 'excellent' && 'text-green-600',
              scoreStatus.status === 'good' && 'text-blue-600',
              scoreStatus.status === 'warning' && 'text-yellow-600',
              scoreStatus.status === 'critical' && 'text-red-600'
            )}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {data.apiName}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{data.category}</span>
              <span>•</span>
              <span>SLA: {data.slaCompliance.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {scoreChange && (
            <div
              className={clsx(
                'flex items-center space-x-1 text-sm font-medium',
                scoreChange.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {scoreChange.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {scoreChange.isPositive ? '+' : ''}
                {scoreChange.value.toFixed(1)}
              </span>
            </div>
          )}
          <CircularProgress
            score={data.overallScore}
            size={size === 'small' ? 60 : size === 'large' ? 100 : 80}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div
          className={clsx(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
            getStatusColors(scoreStatus.status)
          )}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          {scoreStatus.label} Health
        </div>
        <div className="text-xs text-gray-500">
          Updated {new Date(data.lastUpdated).toLocaleString()}
        </div>
      </div>

      {showDetails && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Health Metrics
            </h4>
            <div className="space-y-4">
              {scoreBreakdown.breakdown.map((metric, index) => (
                <MetricBar key={index} metric={metric} />
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Score Composition
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Calculated Score:</span>
                <span className="font-medium ml-2">
                  {scoreBreakdown.calculated.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Reported Score:</span>
                <span className="font-medium ml-2">
                  {data.overallScore.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Variance:</span>
                <span
                  className={clsx(
                    'font-medium ml-2',
                    scoreBreakdown.variance > 5
                      ? 'text-red-600'
                      : 'text-green-600'
                  )}
                >
                  {scoreBreakdown.variance.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">SLA Compliance:</span>
                <span className="font-medium ml-2">
                  {data.slaCompliance.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {showRecommendations && data.recommendations.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Recommendations
              </h4>
              <ul className="space-y-2">
                {data.recommendations.map((recommendation, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-sm text-gray-700"
                  >
                    <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.metrics.some((m) => m.status === 'critical') && (
            <div className="border-t pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">
                    Critical Issues Detected
                  </span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {data.metrics
                    .filter((m) => m.status === 'critical')
                    .map((metric, index) => (
                      <li key={index}>
                        • {metric.name}: {metric.value.toFixed(1)} (target:{' '}
                        {metric.target})
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {!showDetails && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Metrics</div>
            <div className="text-sm font-semibold text-gray-900">
              {data.metrics.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Critical</div>
            <div className="text-sm font-semibold text-red-600">
              {data.metrics.filter((m) => m.status === 'critical').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">SLA</div>
            <div className="text-sm font-semibold text-gray-900">
              {data.slaCompliance.toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthScoreCard;
