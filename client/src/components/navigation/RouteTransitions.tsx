'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface RouteTransitionsProps {
  children: React.ReactNode;
  className?: string;
  transitionDuration?: number;
  transitionType?: 'fade' | 'slide' | 'scale' | 'none';
}

const RouteTransitions: React.FC<RouteTransitionsProps> = ({
  children,
  className = '',
  transitionDuration = 300,
  transitionType = 'fade',
}) => {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (transitionType === 'none') {
      setDisplayChildren(children);
      return;
    }

    setIsTransitioning(true);

    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, transitionDuration / 2);

    return () => clearTimeout(timeout);
  }, [pathname, children, transitionDuration, transitionType]);

  const getTransitionClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';

    switch (transitionType) {
      case 'fade':
        return clsx(baseClasses, isTransitioning ? 'opacity-0' : 'opacity-100');

      case 'slide':
        return clsx(
          baseClasses,
          isTransitioning
            ? 'opacity-0 transform translate-x-4'
            : 'opacity-100 transform translate-x-0'
        );

      case 'scale':
        return clsx(
          baseClasses,
          isTransitioning
            ? 'opacity-0 transform scale-95'
            : 'opacity-100 transform scale-100'
        );

      default:
        return '';
    }
  };

  if (transitionType === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={clsx(getTransitionClasses(), className)}>
      {displayChildren}
    </div>
  );
};

// Loading transition component
interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  isLoading,
  children,
  loadingComponent,
  className = '',
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      return;
    }

    const timeout = setTimeout(() => setShowLoading(false), 150);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const defaultLoadingComponent = (
    <div className="flex items-center justify-center min-h-32">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className={clsx('relative', className)}>
      {/* Loading overlay */}
      <div
        className={clsx(
          'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center transition-opacity duration-300 z-10',
          showLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {loadingComponent || defaultLoadingComponent}
      </div>

      {/* Content */}
      <div
        className={clsx(
          'transition-opacity duration-300',
          isLoading ? 'opacity-50' : 'opacity-100'
        )}
      >
        {children}
      </div>
    </div>
  );
};

// Page transition wrapper with route-specific transitions
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
}) => {
  const pathname = usePathname();

  // Different transition types for different routes
  const getTransitionType = (): 'fade' | 'slide' | 'scale' | 'none' => {
    if (pathname.includes('/auth') || pathname.includes('/login'))
      return 'fade';
    if (pathname.includes('/settings')) return 'slide';
    if (pathname.includes('/apis/')) return 'scale';
    return 'fade';
  };

  return (
    <RouteTransitions
      transitionType={getTransitionType()}
      className={className}
    >
      {children}
    </RouteTransitions>
  );
};

// Animated list transitions
interface AnimatedListProps {
  children: React.ReactNode[];
  itemClassName?: string;
  containerClassName?: string;
  delay?: number;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  itemClassName = '',
  containerClassName = '',
  delay = 100,
}) => {
  const [visibleItems, setVisibleItems] = useState<number>(0);

  useEffect(() => {
    const showItems = () => {
      if (visibleItems < children.length) {
        setVisibleItems((prev) => prev + 1);
      }
    };

    const timeout = setTimeout(showItems, delay);
    return () => clearTimeout(timeout);
  }, [visibleItems, children.length, delay]);

  useEffect(() => {
    setVisibleItems(0);
  }, [children.length]);

  return (
    <div className={containerClassName}>
      {children.map((child, index) => (
        <div
          key={index}
          className={clsx(
            'transition-all duration-500 ease-out',
            index < visibleItems
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-4',
            itemClassName
          )}
          style={{
            transitionDelay: `${index * 50}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Modal transition
interface ModalTransitionProps {
  isOpen: boolean;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export const ModalTransition: React.FC<ModalTransitionProps> = ({
  isOpen,
  children,
  onClose,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      return;
    }

    const timeout = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={clsx(
          'absolute inset-0 bg-black transition-opacity duration-300',
          isOpen ? 'opacity-50' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div
          className={clsx(
            'bg-white rounded-lg shadow-xl transition-all duration-300',
            isOpen
              ? 'opacity-100 transform scale-100'
              : 'opacity-0 transform scale-95',
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// Tab transition
interface TabTransitionProps {
  activeTab: string;
  children: React.ReactNode;
  tabKey: string;
  className?: string;
}

export const TabTransition: React.FC<TabTransitionProps> = ({
  activeTab,
  children,
  tabKey,
  className = '',
}) => {
  const isActive = activeTab === tabKey;
  const [shouldRender, setShouldRender] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      return;
    }

    const timeout = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timeout);
  }, [isActive]);

  if (!shouldRender) return null;

  return (
    <div
      className={clsx(
        'transition-all duration-300 ease-in-out',
        isActive
          ? 'opacity-100 transform translate-x-0'
          : 'opacity-0 transform translate-x-4 absolute inset-0',
        className
      )}
    >
      {children}
    </div>
  );
};

export default RouteTransitions;
