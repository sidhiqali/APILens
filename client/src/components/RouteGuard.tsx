'use client';

import { useAuthHooks } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const RouteGuard = ({
  children,
  requireAuth = false,
  redirectTo,
}: RouteGuardProps) => {
  const { isAuthenticated, isLoading } = useAuthHooks();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to be determined

    if (requireAuth && !isAuthenticated) {
      // Protected route but user not authenticated
      router.replace('/login');
      return;
    }

    if (!requireAuth && isAuthenticated) {
      // Public route but user is authenticated
      const defaultRedirect = redirectTo || '/dashboard';
      router.replace(defaultRedirect);
      return;
    }
  }, [isAuthenticated, isLoading, requireAuth, router, redirectTo]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!requireAuth && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;
