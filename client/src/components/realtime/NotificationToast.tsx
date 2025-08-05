'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Bell,
  Activity,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { RealtimeNotification } from '@/providers/RealtimeProvider';

interface NotificationToastProps {
  notification: RealtimeNotification;
  onDismiss: () => void;
  onAction?: () => void;
  autoHideDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showActions?: boolean;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onAction,
  autoHideDuration = 5000,
  position = 'top-right',
  showActions = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Auto-hide timer
  useEffect(() => {
    // Show with animation
    const showTimeout = setTimeout(() => setIsVisible(true), 50);

    // Auto-hide for non-critical notifications
    let hideTimeout: NodeJS.Timeout;
    if (notification.severity !== 'critical' && autoHideDuration > 0) {
      hideTimeout = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);
    }

    return () => {
      clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [notification.severity, autoHideDuration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5 flex-shrink-0' };

    switch (notification.type) {
      case 'api_change':
        return <Activity {...iconProps} />;
      case 'api_error':
        return <AlertTriangle {...iconProps} />;
      case 'api_recovered':
        return <CheckCircle {...iconProps} />;
      case 'breaking_change':
        return <Zap {...iconProps} />;
      case 'system':
        return <Info {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getSeverityStyles = () => {
    switch (notification.severity) {
      case 'critical':
        return {
          background: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          message: 'text-red-700',
          accent: 'bg-red-500',
        };
      case 'high':
        return {
          background: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          title: 'text-orange-900',
          message: 'text-orange-700',
          accent: 'bg-orange-500',
        };
      case 'medium':
        return {
          background: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          accent: 'bg-yellow-500',
        };
      case 'low':
        return {
          background: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          message: 'text-blue-700',
          accent: 'bg-blue-500',
        };
      default:
        return {
          background: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          message: 'text-gray-700',
          accent: 'bg-gray-500',
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const styles = getSeverityStyles();

  return (
    <div
      className={clsx(
        'fixed z-50 max-w-sm w-full transition-all duration-300 ease-out',
        getPositionClasses(),
        isVisible && !isLeaving
          ? 'opacity-100 transform translate-x-0 scale-100'
          : 'opacity-0 transform translate-x-2 scale-95'
      )}
    >
      <div
        className={clsx(
          'relative bg-white rounded-lg shadow-lg border-l-4 border',
          styles.background,
          'overflow-hidden'
        )}
      >
        {/* Accent bar */}
        <div
          className={clsx('absolute left-0 top-0 bottom-0 w-1', styles.accent)}
        />

        {/* Content */}
        <div className="p-4 pl-6">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={clsx('mt-0.5', styles.icon)}>{getIcon()}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4
                className={clsx('text-sm font-semibold truncate', styles.title)}
              >
                {notification.title}
              </h4>
              <p className={clsx('text-sm mt-1', styles.message)}>
                {notification.message}
              </p>

              {/* Metadata */}
              {notification.metadata && (
                <div className="mt-2 space-y-1">
                  {notification.metadata.changesCount && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>
                        {notification.metadata.changesCount} changes detected
                      </span>
                    </div>
                  )}
                  {notification.metadata.apiName && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Activity className="w-3 h-3" />
                      <span>API: {notification.metadata.apiName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {showActions && (
                <div className="flex items-center space-x-3 mt-3">
                  {onAction && (
                    <button
                      onClick={onAction}
                      className={clsx(
                        'text-xs font-medium px-3 py-1 rounded-md transition-colors',
                        notification.severity === 'critical' ||
                          notification.severity === 'high'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      )}
                    >
                      View Details
                    </button>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        {notification.severity !== 'critical' && autoHideDuration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className={clsx(
                'h-full transition-all ease-linear',
                styles.accent
              )}
              style={{
                width: '100%',
                animation: `shrink ${autoHideDuration}ms linear`,
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

// Container for managing multiple toasts
interface NotificationToastContainerProps {
  notifications: RealtimeNotification[];
  onDismiss: (id: string) => void;
  onAction?: (notification: RealtimeNotification) => void;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationToastContainer: React.FC<
  NotificationToastContainerProps
> = ({
  notifications,
  onDismiss,
  onAction,
  maxVisible = 5,
  position = 'top-right',
}) => {
  // Show only the most recent notifications
  const visibleNotifications = notifications.slice(0, maxVisible);

  // Calculate stacking offset
  const getStackOffset = (index: number) => {
    const baseOffset = index * 4;
    const scaleOffset = index * 2;
    return {
      transform: `translateY(${baseOffset}px) scale(${1 - scaleOffset * 0.02})`,
    };
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={getStackOffset(index)}
        >
          <NotificationToast
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
            onAction={onAction ? () => onAction(notification) : undefined}
            position={position}
            autoHideDuration={notification.severity === 'critical' ? 0 : 5000}
          />
        </div>
      ))}

      {/* Show count if there are more notifications */}
      {notifications.length > maxVisible && (
        <div
          className={clsx(
            'fixed z-40 pointer-events-auto',
            position === 'top-right'
              ? 'top-4 right-4'
              : position === 'top-left'
                ? 'top-4 left-4'
                : position === 'bottom-right'
                  ? 'bottom-4 right-4'
                  : 'bottom-4 left-4'
          )}
        >
          <div
            className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
            style={{
              marginTop: position.includes('top')
                ? `${maxVisible * 4 + 80}px`
                : undefined,
              marginBottom: position.includes('bottom')
                ? `${maxVisible * 4 + 80}px`
                : undefined,
            }}
          >
            +{notifications.length - maxVisible} more notifications
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for managing notification toasts
export const useNotificationToasts = () => {
  const [toasts, setToasts] = useState<RealtimeNotification[]>([]);

  const addToast = (notification: RealtimeNotification) => {
    setToasts((prev) => [notification, ...prev]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };
};

export default NotificationToast;
