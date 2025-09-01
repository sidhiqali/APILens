'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Notification } from '@/services/notification.service';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  showDeleteButton?: boolean;
  compact?: boolean;
  className?: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  showDeleteButton = true,
  compact = false,
  className = '',
}) => {
  const router = useRouter();

  const handleClick = async () => {
    try {
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification._id);
      }

      if (notification.apiId) {
        router.push(`/apis/${notification.apiId}?notification=${notification._id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSeverityIcon = (severity: string) => {
    const iconClass = compact ? 'w-4 h-4' : 'w-5 h-5';
    switch (severity) {
      case 'critical':
        return <XCircle className={clsx(iconClass, 'text-red-600')} />;
      case 'high':
        return <AlertTriangle className={clsx(iconClass, 'text-orange-600')} />;
      case 'medium':
        return <Clock className={clsx(iconClass, 'text-yellow-600')} />;
      case 'low':
        return <CheckCircle className={clsx(iconClass, 'text-blue-600')} />;
      default:
        return <Bell className={clsx(iconClass, 'text-gray-600')} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'cursor-pointer transition-all group',
        compact ? 'p-3' : 'p-4',
        !notification.read && (compact ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'bg-blue-50 border-l-4 border-l-blue-500'),
        compact ? 'border-b border-gray-100 hover:bg-gray-50' : 'bg-white border rounded-lg shadow-sm hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getSeverityIcon(notification.severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={clsx(
                  compact ? 'text-sm' : 'text-base',
                  'font-medium text-gray-900',
                  !notification.read && 'font-semibold'
                )}>
                  {notification.title}
                </h3>
                {!compact && (
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded-full border',
                    getSeverityColor(notification.severity)
                  )}>
                    {notification.severity}
                  </span>
                )}
                {!notification.read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </div>
              <p className={clsx(
                compact ? 'text-sm' : 'text-base',
                'text-gray-600',
                compact ? 'mb-1' : 'mb-2',
                compact ? 'line-clamp-1' : 'line-clamp-2'
              )}>
                {notification.message}
              </p>
              <div className={clsx(
                'flex items-center space-x-2 text-xs text-gray-500',
                compact ? 'space-x-2' : 'space-x-4'
              )}>
                <span>{formatRelativeTime(notification.createdAt)}</span>
                {!compact && (
                  <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                )}
                {notification.apiId && (
                  <div className="flex items-center">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    <span>View API</span>
                  </div>
                )}
              </div>
            </div>
            {showDeleteButton && onDelete && (
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={(e) => onDelete(e, notification._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
