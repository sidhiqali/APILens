'use client';

import React from 'react';
import { AlertTriangle, X, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CriticalAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  apiId: string;
  apiName: string;
  timestamp: string;
  type: 'api_down' | 'high_response_time' | 'error_rate' | 'schema_change' | 'security';
  acknowledged: boolean;
  autoResolve: boolean;
}

interface CriticalAlertsProps {
  alerts?: CriticalAlert[];
  loading?: boolean;
  error?: any;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

const CriticalAlerts: React.FC<CriticalAlertsProps> = ({
  alerts = [],
  loading = false,
  error,
  onAcknowledge,
  onDismiss,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
        </div>
        <div className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Failed to load alerts</p>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(alert => 
    (alert.severity === 'critical' || alert.severity === 'high') && !alert.acknowledged
  );

  if (criticalAlerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
        </div>
        <div className="p-6 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No critical alerts</p>
          <p className="text-xs text-gray-500 mt-1">All systems are running smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {criticalAlerts.length} Alert{criticalAlerts.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {criticalAlerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onAcknowledge={onAcknowledge}
            onDismiss={onDismiss}
          />
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center">
          View All Alerts ({alerts.length})
        </button>
      </div>
    </div>
  );
};

interface AlertItemProps {
  alert: CriticalAlert;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge, onDismiss }) => {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = () => {
    switch (alert.type) {
      case 'api_down':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high_response_time':
        return <Clock className="w-4 h-4" />;
      case 'error_rate':
        return <AlertTriangle className="w-4 h-4" />;
      case 'schema_change':
        return <AlertTriangle className="w-4 h-4" />;
      case 'security':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (alert.type) {
      case 'api_down':
        return 'API Down';
      case 'high_response_time':
        return 'High Response Time';
      case 'error_rate':
        return 'High Error Rate';
      case 'schema_change':
        return 'Schema Change';
      case 'security':
        return 'Security Alert';
      default:
        return 'Alert';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 p-1 rounded ${getSeverityColor()}`}>
          {getTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {alert.title}
            </h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor()}`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{alert.apiName}</span>
              <span>•</span>
              <span>{getTypeLabel()}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-1">
          <button
            onClick={() => window.open(`/apis/${alert.apiId}`, '_blank')}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="View API"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          {onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="p-1 text-gray-400 hover:text-green-600 rounded"
              title="Acknowledge"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CriticalAlerts;
