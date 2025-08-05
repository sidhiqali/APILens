'use client';

import React from 'react';
import { Activity, CheckCircle, AlertTriangle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface ApiHealthInfo {
  id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking' | 'error';
  responseTime: number;
  uptime: number;
  lastChecked: string;
  trend: 'up' | 'down' | 'stable';
}

interface HealthMonitorProps {
  apis?: ApiHealthInfo[];
  loading?: boolean;
  maxItems?: number;
}

const HealthMonitor: React.FC<HealthMonitorProps> = ({ 
  apis = [], 
  loading = false, 
  maxItems = 8 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Health Monitor</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-12 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayApis = apis.slice(0, maxItems);

  if (displayApis.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Health Monitor</h3>
        </div>
        <div className="p-6 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No APIs to monitor</p>
        </div>
      </div>
    );
  }

  const healthyCount = displayApis.filter(api => api.status === 'healthy').length;
  const unhealthyCount = displayApis.filter(api => api.status === 'unhealthy' || api.status === 'error').length;
  const checkingCount = displayApis.filter(api => api.status === 'checking').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Health Monitor</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">{healthyCount} Healthy</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">{unhealthyCount} Issues</span>
            </div>
            {checkingCount > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">{checkingCount} Checking</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayApis.map((api) => (
            <ApiHealthCard key={api.id} api={api} />
          ))}
        </div>
        {apis.length > maxItems && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All APIs ({apis.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ApiHealthCardProps {
  api: ApiHealthInfo;
}

const ApiHealthCard: React.FC<ApiHealthCardProps> = ({ api }) => {
  const getStatusIcon = () => {
    switch (api.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'unhealthy':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'checking':
        return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (api.status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'unhealthy':
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'checking':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTrendIcon = () => {
    switch (api.trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      case 'stable':
        return <div className="w-3 h-0.5 bg-gray-400 rounded"></div>;
      default:
        return null;
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div 
      className={`p-4 rounded-lg border-2 transition-all hover:shadow-sm cursor-pointer ${getStatusColor()}`}
      onClick={() => window.location.href = `/apis/${api.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {api.name}
          </h4>
        </div>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-gray-500 mb-1">Response Time</p>
          <p className="font-medium text-gray-900">
            {formatResponseTime(api.responseTime)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Uptime</p>
          <p className="font-medium text-gray-900">{api.uptime.toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Last checked: {new Date(api.lastChecked).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default HealthMonitor;
