'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import RouteGuard from '@/components/RouteGuard';
import {
  useInfiniteNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  Filter,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type TypeFilter = 'all' | 'api_change' | 'api_error' | 'api_recovered' | 'system';
type ReadFilter = 'all' | 'unread' | 'read';

const NotificationsPage = () => {
  const router = useRouter();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // Build filter params for API call
  const filterParams = {
    limit: 20,
    unreadOnly: readFilter === 'unread',
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteNotifications(filterParams);

  // Flatten paginated data and apply client-side filters
  const allNotifications = data?.pages.flatMap(page => page.notifications) || [];
  const filteredNotifications = allNotifications.filter(notification => {
    if (severityFilter !== 'all' && notification.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    if (readFilter === 'read' && !notification.read) return false;
    if (readFilter === 'unread' && notification.read) return false;
    return true;
  });

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await markAsReadMutation.mutateAsync(notification._id);
      }

      // Navigate to API detail page if apiId exists
      if (notification.apiId) {
        router.push(`/apis/${notification.apiId}?notification=${notification._id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Format relative time
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

  if (isLoading) {
    return (
      <RouteGuard requireAuth={true}>
        <Layout>
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  if (isError) {
    return (
      <RouteGuard requireAuth={true}>
        <Layout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Failed to load notifications
              </h2>
              <p className="text-gray-600">
                Please try refreshing the page or contact support if the issue persists.
              </p>
            </div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={clsx('w-4 h-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="api_change">API Changes</option>
                      <option value="api_error">API Errors</option>
                      <option value="api_recovered">API Recovered</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={readFilter}
                      onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="all">All Notifications</option>
                      <option value="unread">Unread Only</option>
                      <option value="read">Read Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              <>
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={clsx(
                      'p-6 bg-white border rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md group',
                      !notification.read && 'border-l-4 border-l-blue-500 bg-blue-50'
                    )}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={clsx(
                                'text-lg font-medium text-gray-900',
                                !notification.read && 'font-semibold'
                              )}>
                                {notification.title}
                              </h3>
                              <span className={clsx(
                                'px-2 py-1 text-xs font-medium rounded-full border',
                                getSeverityColor(notification.severity)
                              )}>
                                {notification.severity}
                              </span>
                              {!notification.read && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{formatRelativeTime(notification.createdAt)}</span>
                              <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                              {notification.apiId && (
                                <div className="flex items-center">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  <span>View API</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification._id)}
                              disabled={deleteNotificationMutation.isPending}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="text-center pt-6">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-3 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex items-center">
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        'Load More'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-600">
                  {readFilter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : severityFilter !== 'all' || typeFilter !== 'all'
                      ? 'Try adjusting your filters to see more notifications.'
                      : 'Notifications will appear here when there are API changes or issues.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </RouteGuard>
  );
};

export default NotificationsPage;
