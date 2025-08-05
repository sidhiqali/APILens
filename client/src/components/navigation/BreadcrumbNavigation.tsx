'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  className = '',
  showHome = true,
}) => {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if not provided
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if enabled
    if (showHome) {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/dashboard',
        isActive: pathname === '/dashboard',
      });
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Create human-readable labels
      const label = getLabelForSegment(segment, pathSegments, index);

      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: isLast,
      });
    });

    return breadcrumbs;
  };

  const getLabelForSegment = (segment: string, segments: string[], index: number): string => {
    // Handle dynamic routes and common patterns
    const labelMap: Record<string, string> = {
      'apis': 'APIs',
      'add-api': 'Add API',
      'notifications': 'Notifications',
      'analytics': 'Analytics',
      'team': 'Team',
      'settings': 'Settings',
      'profile': 'Profile',
      'security': 'Security',
      'members': 'Members',
      'permissions': 'Permissions',
      'reports': 'Reports',
      'trends': 'Trends',
      'monitoring': 'Monitoring',
      'changelogs': 'Change Logs',
      'dashboard': 'Dashboard',
    };

    // Check if it's a UUID or ID (for dynamic routes)
    if (isUUID(segment) || isObjectId(segment)) {
      // Try to get context from previous segment
      const previousSegment = index > 0 ? segments[index - 1] : '';
      if (previousSegment === 'apis') return 'API Details';
      if (previousSegment === 'team') return 'Member';
      if (previousSegment === 'notifications') return 'Notification';
      return 'Details';
    }

    // Return mapped label or capitalize the segment
    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };

  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const isObjectId = (str: string): boolean => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(str);
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1 && pathname === '/dashboard') {
    return null; // Don't show breadcrumbs on dashboard
  }

  return (
    <nav className={clsx('flex items-center space-x-1 text-sm', className)}>
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.href}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          
          <div className="flex items-center">
            {index === 0 && showHome && (
              <Home className="w-4 h-4 text-gray-500 mr-1" />
            )}
            
            {breadcrumb.isActive ? (
              <span className="text-gray-900 font-medium truncate max-w-32">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-32"
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Enhanced breadcrumb with custom items
interface EnhancedBreadcrumbProps extends BreadcrumbNavigationProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const EnhancedBreadcrumb: React.FC<EnhancedBreadcrumbProps> = ({
  title,
  subtitle,
  actions,
  ...breadcrumbProps
}) => {
  const pathname = usePathname();

  // Get current page title if not provided
  const getPageTitle = () => {
    if (title) return title;

    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';

    const lastSegment = pathSegments[pathSegments.length - 1];
    const titleMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'apis': 'API Management',
      'add-api': 'Add New API',
      'notifications': 'Notifications',
      'analytics': 'Analytics',
      'team': 'Team Management',
      'settings': 'Settings',
      'profile': 'Profile Settings',
      'security': 'Security Settings',
      'monitoring': 'API Monitoring',
    };

    return titleMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation {...breadcrumbProps} />
          
          {/* Page Title */}
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {getPageTitle()}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="ml-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default BreadcrumbNavigation;
