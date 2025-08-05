'use client';

import React from 'react';
import {
  Activity,
  Clock,
  AlertTriangle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityItem {
  id: string;
  type: 'api_change' | 'notification' | 'api_health' | 'api_created';
  apiName?: string;
  apiId?: string;
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'healthy' | 'unhealthy' | 'checking';
}

interface RecentActivityProps {
  data?: RecentActivityItem[];
  loading?: boolean;
  maxItems?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  data = [],
  loading = false,
  maxItems = 10,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activities = data.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="p-6 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};

interface ActivityItemProps {
  activity: RecentActivityItem;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'api_change':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'notification':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'api_health':
        return <Clock className="w-5 h-5 text-green-600" />;
      case 'api_created':
        return <Activity className="w-5 h-5 text-green-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = () => {
    if (!activity.severity) return '';
    switch (activity.severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = () => {
    switch (activity.type) {
      case 'api_change':
        return 'API Change';
      case 'notification':
        return 'Notification';
      case 'api_health':
        return 'Health Check';
      case 'api_created':
        return 'API Created';
      default:
        return 'Activity';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className="p-1 rounded-full bg-gray-100">{getIcon()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.apiName || 'System'}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {getTypeLabel()}
            </span>
            {activity.severity && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor()}`}
              >
                {activity.severity}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(activity.timestamp), {
                addSuffix: true,
              })}
            </p>
            <div className="flex items-center space-x-2">
              <button
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                onClick={() => {
                  // Navigate to API details
                  if (activity.apiId) {
                    window.location.href = `/apis/${activity.apiId}`;
                  }
                }}
                disabled={!activity.apiId}
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
              {activity.apiId && (
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  onClick={() => {
                    // Open in new tab
                    window.open(`/apis/${activity.apiId}`, '_blank');
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
