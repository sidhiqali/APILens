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

  const { data: unreadCount = 0, error: unreadCountError } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  React.useEffect(() => {
    if (unreadCountError) {
    }
  }, [unreadCountError]);

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

  const allNotifications = React.useMemo(() => {
    if (!data || !data.pages) {
      return [];
    }
    return data.pages.flatMap(page => {
      if (!page || !page.notifications) {
        return [];
      }
      return page.notifications || [];
    });
  }, [data]);

  const filteredNotifications = React.useMemo(() => {
    return allNotifications.filter(notification => {
      if (!notification) return false;
      if (severityFilter !== 'all' && notification.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
      if (readFilter === 'read' && !notification.read) return false;
      if (readFilter === 'unread' && notification.read) return false;
      return true;
    });
  }, [allNotifications, severityFilter, typeFilter, readFilter]);

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.read) {
        await markAsReadMutation.mutateAsync(notification._id);
      }

      const apiId = typeof notification.apiId === 'object' && notification.apiId?._id 
        ? notification.apiId._id 
        : notification.apiId;

      if (apiId) {
        router.push(`/apis/${apiId}?notification=${notification._id}`);
      } else {
        console.log('No apiId found for notification:', notification);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
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
        <div className="max-w-4xl p-6 mx-auto">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Notifications</h1>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={clsx('w-4 h-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
              </button>
            </div>

            {showFilters && (
              <div className="p-4 mt-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Severity
                    </label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="api_change">API Changes</option>
                      <option value="api_error">API Errors</option>
                      <option value="api_recovered">API Recovered</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={readFilter}
                      onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            <div className="flex items-center mb-1 space-x-2">
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
                            <p className="mb-3 text-gray-600">
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
                          <div className="flex items-center ml-4 space-x-2">
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification._id)}
                              disabled={deleteNotificationMutation.isPending}
                              className="p-2 text-gray-400 transition-all rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {hasNextPage && (
                  <div className="pt-6 text-center">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-3 text-sm font-medium text-blue-600 transition-colors bg-white border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50"
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
              <div className="py-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
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
