'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Plus,
  RefreshCw,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkAsRead, 
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationRealtime 
} from '@/hooks/useNotifications';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { clsx } from 'clsx';

interface TopBarProps {
  onMenuToggle: () => void;
  title?: string;
  showSearch?: boolean;
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({
  onMenuToggle,
  title,
  showSearch = true,
  className = '',
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { subscribe } = useWebSocket();
  
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications({ 
    limit: 10,
    unreadOnly: false 
  });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const { addNewNotification, invalidateNotifications } = useNotificationRealtime();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribe('notification_created', (notification: any) => {
      addNewNotification(notification);
    });

    const unsubscribeUpdated = subscribe('notification_updated', () => {
      invalidateNotifications();
    });

    return () => {
      unsubscribe?.();
      unsubscribeUpdated?.();
    };
  }, [subscribe, addNewNotification, invalidateNotifications]);

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.read) {
        await markAsReadMutation.mutateAsync(notification._id);
      }

      if (notification.apiId) {
        window.location.href = `/apis/${notification.apiId}?notification=${notification._id}`;
      }
      
      setShowNotifications(false);
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

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getPageTitle = () => {
    if (title) return title;

    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';

    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard',
      apis: 'API Management',
      'add-api': 'Add New API',
      notifications: 'Notifications',
      analytics: 'Analytics',
      team: 'Team Management',
      settings: 'Settings',
    };

    return (
      titleMap[pathSegments[0]] ||
      pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1)
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const quickActions = [
    {
      label: 'Add API',
      href: '/add-api',
      icon: Plus,
      variant: 'primary' as const,
    },
    {
      label: 'Refresh All',
      href: '/apis?action=refresh',
      icon: RefreshCw,
      variant: 'secondary' as const,
    },
  ];

  return (
    <header
      className={clsx(
        'bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          {pathname !== '/dashboard' && (
            <nav className="text-sm text-gray-500 mt-1">
              <Link href="/dashboard" className="hover:text-gray-700">
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{getPageTitle()}</span>
            </nav>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search APIs, changes, notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={clsx(
                'inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <action.icon className="w-4 h-4" />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Notifications
                  </h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <>
                        <span className="text-sm text-blue-600 font-medium">
                          {unreadCount} unread
                        </span>
                        <button
                          onClick={handleMarkAllAsRead}
                          disabled={markAllAsReadMutation.isPending}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-gray-400 animate-spin" />
                    <p className="text-sm text-gray-500">Loading notifications...</p>
                  </div>
                ) : notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                  notificationsData.notifications
                    .slice(0, 8)
                    .map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={clsx(
                          'p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors relative group',
                          !notification.read && 'bg-blue-50 border-l-4 border-l-blue-500'
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={clsx(
                              'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                              notification.severity === 'critical'
                                ? 'bg-red-500'
                                : notification.severity === 'high'
                                  ? 'bg-orange-500'
                                  : notification.severity === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-500'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={clsx(
                                'text-sm font-medium text-gray-900 truncate',
                                !notification.read && 'font-semibold'
                              )}>
                                {notification.title}
                              </p>
                              <div className="flex items-center space-x-1 ml-2">
                                {notification.apiId && (
                                  <ExternalLink className="w-3 h-3 text-gray-400" />
                                )}
                                <button
                                  onClick={(e) => handleDeleteNotification(e, notification._id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                                  disabled={deleteNotificationMutation.isPending}
                                >
                                  <X className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(notification.createdAt)}
                              </p>
                              {!notification.read && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-200">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </Link>

        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500">{user.role || 'User'}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default TopBar;
