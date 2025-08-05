'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NavigationMenu from '../navigation/NavigationMenu';
import TopBar from '../navigation/TopBar';
import { EnhancedBreadcrumb } from '../navigation/BreadcrumbNavigation';
import { clsx } from 'clsx';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbItems?: Array<{ label: string; href: string; isActive?: boolean }>;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
  showTopBar?: boolean;
  showNavigation?: boolean;
  fullWidth?: boolean;
  className?: string;
  contentClassName?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbItems,
  actions,
  showBreadcrumbs = true,
  showTopBar = true,
  showNavigation = true,
  fullWidth = false,
  className = '',
  contentClassName = '',
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when route changes
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Check if we're on auth pages
  const isAuthPage = pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/auth');

  if (isAuthPage) {
    return (
      <div className={clsx('min-h-screen bg-gray-50', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={clsx('min-h-screen bg-gray-50', className)}>
      {/* Navigation Sidebar */}
      {showNavigation && (
        <NavigationMenu
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className={clsx(
        'flex flex-col min-h-screen',
        showNavigation && 'lg:pl-64'
      )}>
        {/* Top Bar */}
        {showTopBar && (
          <TopBar
            onMenuToggle={toggleSidebar}
            title={title}
            showSearch={!isAuthPage}
          />
        )}

        {/* Enhanced Breadcrumb */}
        {showBreadcrumbs && !isAuthPage && (
          <EnhancedBreadcrumb
            title={title}
            subtitle={subtitle}
            items={breadcrumbItems}
            actions={actions}
          />
        )}

        {/* Page Content */}
        <main className={clsx(
          'flex-1',
          fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-6 py-6',
          contentClassName
        )}>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className={clsx(
            'flex items-center justify-between text-sm text-gray-500',
            !fullWidth && 'max-w-7xl mx-auto'
          )}>
            <div className="flex items-center space-x-4">
              <span>© 2024 APILens. All rights reserved.</span>
              <span>•</span>
              <a href="/privacy" className="hover:text-gray-700">Privacy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-gray-700">Terms</a>
            </div>
            <div className="flex items-center space-x-4">
              <span>v1.0.0</span>
              <span>•</span>
              <a href="/support" className="hover:text-gray-700">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Specialized layout variants
export const DashboardLayout: React.FC<Omit<PageLayoutProps, 'showBreadcrumbs'>> = (props) => (
  <PageLayout {...props} showBreadcrumbs={false} />
);

export const SettingsLayout: React.FC<PageLayoutProps> = (props) => (
  <PageLayout
    {...props}
    breadcrumbItems={[
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/settings', isActive: true },
    ]}
  />
);

export const APILayout: React.FC<PageLayoutProps> = (props) => (
  <PageLayout
    {...props}
    breadcrumbItems={[
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'APIs', href: '/apis', isActive: true },
    ]}
  />
);

// Loading layout for async pages
interface LoadingLayoutProps {
  title?: string;
  showSkeleton?: boolean;
}

export const LoadingLayout: React.FC<LoadingLayoutProps> = ({ 
  title = 'Loading...', 
  showSkeleton = true 
}) => (
  <PageLayout title={title}>
    <div className="space-y-6">
      {showSkeleton ? (
        <>
          {/* Header Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  </PageLayout>
);

// Error layout for error states
interface ErrorLayoutProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ErrorLayout: React.FC<ErrorLayoutProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this page.',
  actionLabel = 'Try Again',
  onAction,
}) => (
  <PageLayout title={title}>
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 text-red-500">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  </PageLayout>
);

export default PageLayout;
