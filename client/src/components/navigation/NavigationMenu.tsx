'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Activity,
  Plus,
  Settings,
  Bell,
  BarChart3,
  Users,
  Shield,
  Calendar,
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  GitCommit,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useNotifications } from '@/hooks/useNotifications';
import { clsx } from 'clsx';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavigationItem[];
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

interface NavigationMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  isOpen,
  onToggle,
  className = '',
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: notificationsData } = useNotifications();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const unreadCount =
    notificationsData?.notifications?.filter((n: any) => !n.read)?.length || 0;

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      id: 'apis',
      label: 'APIs',
      href: '/apis',
      icon: Activity,
      children: [
        {
          id: 'apis-list',
          label: 'All APIs',
          href: '/apis',
          icon: Activity,
        },
        {
          id: 'apis-add',
          label: 'Add API',
          href: '/add-api',
          icon: Plus,
        },
        {
          id: 'apis-changes',
          label: 'Changes',
          href: '/changes',
          icon: GitCommit,
        },
        {
          id: 'apis-issues',
          label: 'Issues',
          href: '/issues',
          icon: AlertTriangle,
        },
        {
          id: 'apis-monitoring',
          label: 'Monitoring',
          href: '/apis/monitoring',
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'changes',
      label: 'Changes',
      href: '/changes',
      icon: GitCommit,
    },
    {
      id: 'issues',
      label: 'Issues',
      href: '/issues',
      icon: AlertTriangle,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      children: [
        {
          id: 'analytics-overview',
          label: 'Overview',
          href: '/analytics',
          icon: BarChart3,
        },
        {
          id: 'analytics-reports',
          label: 'Reports',
          href: '/analytics/reports',
          icon: FileText,
        },
        {
          id: 'analytics-trends',
          label: 'Trends',
          href: '/analytics/trends',
          icon: Calendar,
        },
      ],
    },
    {
      id: 'team',
      label: 'Team',
      href: '/team',
      icon: Users,
      requiresAuth: true,
      children: [
        {
          id: 'team-members',
          label: 'Members',
          href: '/team/members',
          icon: Users,
        },
        {
          id: 'team-permissions',
          label: 'Permissions',
          href: '/team/permissions',
          icon: Shield,
          adminOnly: true,
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      children: [
        {
          id: 'settings-profile',
          label: 'Profile',
          href: '/settings/profile',
          icon: Users,
        },
        {
          id: 'settings-notifications',
          label: 'Notifications',
          href: '/settings/notifications',
          icon: Bell,
        },
        {
          id: 'settings-security',
          label: 'Security',
          href: '/settings/security',
          icon: Shield,
        },
      ],
    },
  ];

  const filteredItems = navigationItems.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some((child) => isActive(child.href)) || false;
  };

  useEffect(() => {
    // Auto-expand active parent items
    filteredItems.forEach((item) => {
      if (item.children && isParentActive(item)) {
        setExpandedItems((prev) =>
          prev.includes(item.id) ? prev : [...prev, item.id]
        );
      }
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">APILens</span>
            </Link>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg lg:hidden hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {filteredItems.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  isParentActive={isParentActive}
                  isExpanded={expandedItems.includes(item.id)}
                  onToggleExpanded={() => toggleExpanded(item.id)}
                  onItemClick={onToggle}
                />
              ))}
            </ul>
          </nav>

          {/* User Section */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center mb-3 space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role || 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2 space-x-2 text-sm text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

interface NavigationItemProps {
  item: NavigationItem;
  isActive: (href: string) => boolean;
  isParentActive: (item: NavigationItem) => boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onItemClick: () => void;
  depth?: number;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  isActive,
  isParentActive,
  isExpanded,
  onToggleExpanded,
  onItemClick,
  depth = 0,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = isActive(item.href);
  const isParentItemActive = isParentActive(item);

  const ItemContent = () => (
    <div
      className={clsx(
        'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group',
        depth > 0 && 'ml-4',
        isItemActive
          ? 'bg-blue-50 text-blue-700'
          : isParentItemActive && hasChildren
            ? 'bg-gray-50 text-gray-900'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <item.icon
        className={clsx(
          'w-5 h-5 flex-shrink-0',
          isItemActive
            ? 'text-blue-600'
            : 'text-gray-500 group-hover:text-gray-700'
        )}
      />
      <span className="flex-1 font-medium">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleExpanded();
          }}
          className="p-1 rounded hover:bg-gray-200"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <li>
      {hasChildren ? (
        <div>
          <div onClick={onToggleExpanded} className="cursor-pointer">
            <ItemContent />
          </div>
          {isExpanded && (
            <ul className="mt-1 space-y-1">
              {item.children?.map((child) => (
                <NavigationItem
                  key={child.id}
                  item={child}
                  isActive={isActive}
                  isParentActive={isParentActive}
                  isExpanded={false}
                  onToggleExpanded={() => {}}
                  onItemClick={onItemClick}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <Link href={item.href} onClick={onItemClick}>
          <ItemContent />
        </Link>
      )}
    </li>
  );
};

export default NavigationMenu;
