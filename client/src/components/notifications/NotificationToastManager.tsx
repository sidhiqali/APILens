'use client';

import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useNotificationRealtime } from '@/hooks/useNotifications';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { Notification } from '@/services/notification.service';

interface NotificationToastProps {
  notification: Notification;
  onDismiss?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleClick = () => {
    if (notification.apiId) {
      window.location.href = `/apis/${notification.apiId}?notification=${notification._id}`;
    }
    onDismiss?.();
  };

  return (
    <div 
      onClick={handleClick}
      className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow max-w-sm"
    >
      <div className="flex-shrink-0">
        {getSeverityIcon(notification.severity)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
          {notification.message}
        </p>
        {notification.apiId && (
          <p className="text-xs text-blue-600 mt-2">
            Click to view API details →
          </p>
        )}
      </div>
    </div>
  );
};

const NotificationToastManager: React.FC = () => {
  const { subscribe } = useWebSocket();
  const { addNewNotification } = useNotificationRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('notification_created', (notification: Notification) => {
      addNewNotification(notification);

      if (['high', 'critical'].includes(notification.severity)) {
        toast.custom(
          (t) => (
            <NotificationToast
              notification={notification}
              onDismiss={() => toast.dismiss(t.id)}
            />
          ),
          {
            duration: notification.severity === 'critical' ? 8000 : 5000,
            position: 'top-right',
          }
        );
      } else {
        toast.success(notification.title, {
          duration: 3000,
          position: 'top-right',
          icon: '🔔',
        });
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [subscribe, addNewNotification]);

  return null;
};

export default NotificationToastManager;
