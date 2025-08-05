'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Clock,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

interface TrendDataPoint {
  timestamp: string;
  value: number;
  date: string;
}

interface TrendAnalysisData {
  apiId: string;
  apiName: string;
  metric: 'responseTime' | 'uptime' | 'errorRate' | 'requestCount';
  data: TrendDataPoint[];
  baseline?: number;
  target?: number;
}

interface TrendInsight {
  type: 'improvement' | 'degradation' | 'stable' | 'anomaly' | 'prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  impact: string;
  recommendation?: string;
  timeframe: string;
}

interface TrendAnalysisProps {
  data: TrendAnalysisData[];
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void;
  className?: string;
  showPredictions?: boolean;
  analysisDepth?: 'basic' | 'advanced' | 'expert';
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  className = '',
  showPredictions = true,
  analysisDepth = 'advanced',
}) => {
  const [selectedMetric, setSelectedMetric] = useState<
    'responseTime' | 'uptime' | 'errorRate' | 'requestCount'
  >('responseTime');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Generate insights from data
  const insights = useMemo(() => {
    const allInsights: TrendInsight[] = [];

    data.forEach((apiData) => {
      if (apiData.metric !== selectedMetric) return;

      const values = apiData.data.map((d) => d.value);
      const timestamps = apiData.data.map((d) =>
        new Date(d.timestamp).getTime()
      );

      // Calculate trend metrics
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const standardDeviation = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
          values.length
      );

      // Linear regression for trend direction
      const n = values.length;
      const sumX = timestamps.reduce((sum, t) => sum + t, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = timestamps.reduce((sum, t, i) => sum + t * values[i], 0);
      const sumXX = timestamps.reduce((sum, t) => sum + t * t, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      const correlation = calculateCorrelation(timestamps, values);

      // Detect anomalies (values beyond 2 standard deviations)
      const anomalies = values.filter(
        (val) => Math.abs(val - average) > 2 * standardDeviation
      );

      // Generate insights based on analysis
      generateTrendInsights(
        apiData,
        slope,
        correlation,
        anomalies,
        average,
        standardDeviation,
        allInsights
      );

      if (showPredictions) {
        generatePredictiveInsights(
          apiData,
          slope,
          intercept,
          timestamps,
          allInsights
        );
      }
    });

    // Sort by severity and confidence
    return allInsights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.confidence - a.confidence;
    });
  }, [data, selectedMetric, showPredictions]);

  const calculateCorrelation = (x: number[], y: number[]) => {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const generateTrendInsights = (
    apiData: TrendAnalysisData,
    slope: number,
    correlation: number,
    anomalies: number[],
    average: number,
    _standardDeviation: number,
    insights: TrendInsight[]
  ) => {
    const strongCorrelation = Math.abs(correlation) > 0.7;
    const moderateCorrelation = Math.abs(correlation) > 0.4;

    // Trend direction insights
    if (strongCorrelation) {
      if (slope > 0) {
        const severity = apiData.metric === 'uptime' ? 'low' : 'high';
        insights.push({
          type: apiData.metric === 'uptime' ? 'improvement' : 'degradation',
          severity,
          title: `${apiData.metric === 'uptime' ? 'Improving' : 'Declining'} ${getMetricLabel(apiData.metric)}`,
          description: `${apiData.apiName} shows a strong ${apiData.metric === 'uptime' ? 'upward' : 'downward'} trend in ${getMetricLabel(apiData.metric).toLowerCase()}.`,
          confidence: Math.abs(correlation) * 100,
          impact: getImpactDescription(apiData.metric, slope > 0),
          recommendation: getRecommendation(apiData.metric, slope > 0),
          timeframe: timeRange,
        });
      } else {
        const severity = apiData.metric === 'uptime' ? 'high' : 'low';
        insights.push({
          type: apiData.metric === 'uptime' ? 'degradation' : 'improvement',
          severity,
          title: `${apiData.metric === 'uptime' ? 'Declining' : 'Improving'} ${getMetricLabel(apiData.metric)}`,
          description: `${apiData.apiName} shows a strong ${apiData.metric === 'uptime' ? 'downward' : 'upward'} trend in ${getMetricLabel(apiData.metric).toLowerCase()}.`,
          confidence: Math.abs(correlation) * 100,
          impact: getImpactDescription(apiData.metric, slope > 0),
          recommendation: getRecommendation(apiData.metric, slope > 0),
          timeframe: timeRange,
        });
      }
    } else if (moderateCorrelation) {
      insights.push({
        type: 'stable',
        severity: 'low',
        title: `Moderate Fluctuation in ${getMetricLabel(apiData.metric)}`,
        description: `${apiData.apiName} shows moderate variations in ${getMetricLabel(apiData.metric).toLowerCase()}.`,
        confidence: Math.abs(correlation) * 100,
        impact: 'Performance shows some variation but no clear trend.',
        timeframe: timeRange,
      });
    }

    // Anomaly detection
    if (anomalies.length > 0) {
      const anomalyPercentage = (anomalies.length / apiData.data.length) * 100;
      insights.push({
        type: 'anomaly',
        severity: anomalyPercentage > 10 ? 'high' : 'medium',
        title: `Performance Anomalies Detected`,
        description: `${anomalies.length} anomalous readings detected in ${apiData.apiName} (${anomalyPercentage.toFixed(1)}% of data points).`,
        confidence: 85,
        impact: `Unusual spikes or drops in ${getMetricLabel(apiData.metric).toLowerCase()} may indicate underlying issues.`,
        recommendation: 'Investigate root causes of performance anomalies.',
        timeframe: timeRange,
      });
    }

    // Baseline comparison
    if (apiData.baseline) {
      const deviationPercentage =
        ((average - apiData.baseline) / apiData.baseline) * 100;
      if (Math.abs(deviationPercentage) > 10) {
        insights.push({
          type: deviationPercentage > 0 ? 'degradation' : 'improvement',
          severity: Math.abs(deviationPercentage) > 25 ? 'high' : 'medium',
          title: `Baseline Deviation: ${deviationPercentage > 0 ? 'Above' : 'Below'} Expected`,
          description: `${apiData.apiName} is performing ${Math.abs(deviationPercentage).toFixed(1)}% ${deviationPercentage > 0 ? 'worse' : 'better'} than baseline.`,
          confidence: 90,
          impact: `Current performance differs significantly from established baseline.`,
          timeframe: timeRange,
        });
      }
    }
  };

  const generatePredictiveInsights = (
    apiData: TrendAnalysisData,
    slope: number,
    intercept: number,
    timestamps: number[],
    insights: TrendInsight[]
  ) => {
    // Predict next 7 days
    const lastTimestamp = timestamps[timestamps.length - 1];
    const futureTimestamp = lastTimestamp + 7 * 24 * 60 * 60 * 1000; // 7 days ahead
    const predictedValue = slope * futureTimestamp + intercept;

    const currentValue = apiData.data[apiData.data.length - 1].value;
    const predictedChange =
      ((predictedValue - currentValue) / currentValue) * 100;

    if (Math.abs(predictedChange) > 5) {
      insights.push({
        type: 'prediction',
        severity: Math.abs(predictedChange) > 20 ? 'high' : 'medium',
        title: `7-Day Prediction: ${predictedChange > 0 ? 'Increase' : 'Decrease'} Expected`,
        description: `Based on current trends, ${apiData.apiName} ${getMetricLabel(apiData.metric).toLowerCase()} is predicted to ${predictedChange > 0 ? 'increase' : 'decrease'} by ${Math.abs(predictedChange).toFixed(1)}% in the next 7 days.`,
        confidence: 70,
        impact: `Projected ${getMetricLabel(apiData.metric).toLowerCase()}: ${formatValue(predictedValue, apiData.metric)}`,
        recommendation: getPredictiveRecommendation(
          apiData.metric,
          predictedChange
        ),
        timeframe: '7d forecast',
      });
    }
  };

  const getMetricLabel = (metric: string) => {
    const labels = {
      responseTime: 'Response Time',
      uptime: 'Uptime',
      errorRate: 'Error Rate',
      requestCount: 'Request Count',
    };
    return labels[metric as keyof typeof labels] || metric;
  };

  const getImpactDescription = (metric: string, isIncreasing: boolean) => {
    if (metric === 'uptime') {
      return isIncreasing
        ? 'Improved reliability and user experience.'
        : 'Decreased reliability may affect user satisfaction.';
    }
    if (metric === 'responseTime') {
      return isIncreasing
        ? 'Slower response times may impact user experience.'
        : 'Faster response times improve user experience.';
    }
    if (metric === 'errorRate') {
      return isIncreasing
        ? 'Higher error rates indicate potential system issues.'
        : 'Lower error rates suggest improved stability.';
    }
    return isIncreasing
      ? 'Increased activity levels.'
      : 'Decreased activity levels.';
  };

  const getRecommendation = (metric: string, isIncreasing: boolean) => {
    if (metric === 'responseTime' && isIncreasing) {
      return 'Consider optimizing database queries, implementing caching, or scaling infrastructure.';
    }
    if (metric === 'errorRate' && isIncreasing) {
      return 'Investigate error logs, review recent deployments, and implement additional monitoring.';
    }
    if (metric === 'uptime' && !isIncreasing) {
      return 'Review infrastructure stability, implement redundancy, and improve monitoring.';
    }
    return 'Continue monitoring and maintain current performance levels.';
  };

  const getPredictiveRecommendation = (metric: string, change: number) => {
    if (metric === 'responseTime' && change > 0) {
      return 'Proactively optimize performance before degradation occurs.';
    }
    if (metric === 'errorRate' && change > 0) {
      return 'Prepare error mitigation strategies and review system capacity.';
    }
    return 'Monitor closely and prepare appropriate responses to predicted changes.';
  };

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'responseTime':
        return `${value.toFixed(0)}ms`;
      case 'uptime':
        return `${value.toFixed(1)}%`;
      case 'errorRate':
        return `${value.toFixed(2)}%`;
      case 'requestCount':
        return value >= 1000
          ? `${(value / 1000).toFixed(1)}k`
          : value.toFixed(0);
      default:
        return value.toFixed(2);
    }
  };

  const getInsightIcon = (type: TrendInsight['type']) => {
    switch (type) {
      case 'improvement':
        return TrendingUp;
      case 'degradation':
        return TrendingDown;
      case 'stable':
        return Activity;
      case 'anomaly':
        return AlertTriangle;
      case 'prediction':
        return Target;
      default:
        return BarChart3;
    }
  };

  const getSeverityColor = (severity: TrendInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const metricOptions = [
    { value: 'responseTime', label: 'Response Time', icon: Clock },
    { value: 'uptime', label: 'Uptime', icon: TrendingUp },
    { value: 'errorRate', label: 'Error Rate', icon: AlertTriangle },
    { value: 'requestCount', label: 'Request Count', icon: BarChart3 },
  ];

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Trend Analysis
            </h3>
            <p className="text-sm text-gray-600">
              AI-powered insights and predictions
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        {insights.length > 0 ? (
          insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const isExpanded = expandedInsight === `${index}`;

            return (
              <div
                key={index}
                className={clsx(
                  'border rounded-lg p-4 transition-all cursor-pointer',
                  getSeverityColor(insight.severity),
                  isExpanded && 'ring-2 ring-purple-500'
                )}
                onClick={() =>
                  setExpandedInsight(isExpanded ? null : `${index}`)
                }
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold truncate">
                        {insight.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                          {insight.confidence.toFixed(0)}% confidence
                        </span>
                        <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                          {insight.timeframe}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mt-1">{insight.description}</p>

                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <span className="text-xs font-medium">Impact:</span>
                          <p className="text-sm">{insight.impact}</p>
                        </div>
                        {insight.recommendation && (
                          <div>
                            <span className="text-xs font-medium">
                              Recommendation:
                            </span>
                            <p className="text-sm">{insight.recommendation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Insights Available
            </h3>
            <p className="text-gray-600">
              Insufficient data to generate meaningful insights. More data will
              improve analysis quality.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Analysis Depth: {analysisDepth}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <p className="text-xs text-gray-600">Improvements</p>
          </div>
          <div className="text-center">
            <TrendingDown className="w-6 h-6 mx-auto mb-1 text-red-600" />
            <p className="text-xs text-gray-600">Degradations</p>
          </div>
          <div className="text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-orange-600" />
            <p className="text-xs text-gray-600">Anomalies</p>
          </div>
          <div className="text-center">
            <Target className="w-6 h-6 mx-auto mb-1 text-purple-600" />
            <p className="text-xs text-gray-600">Predictions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
