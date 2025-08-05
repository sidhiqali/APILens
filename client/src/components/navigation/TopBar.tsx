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
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useNotifications } from '@/hooks/useNotifications';
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
  const { data: notificationsData } = useNotifications({ unreadOnly: true });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notificationsData?.notifications?.length || 0;

  // Get dynamic title based on route
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

  // Close dropdowns on outside click
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
      // Navigate to search results
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
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Page Title */}
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

      {/* Center Section - Search */}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Quick Actions */}
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

        {/* Notifications */}
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

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationsData?.notifications
                  ?.slice(0, 5)
                  .map((notification) => (
                    <div
                      key={notification._id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
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
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {(!notificationsData?.notifications ||
                  notificationsData.notifications.length === 0) && (
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

        {/* Settings */}
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </Link>

        {/* User Menu */}
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

            {/* User Dropdown */}
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
