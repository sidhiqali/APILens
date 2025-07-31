'use client';

import RouteGuard from '@/components/RouteGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard requireAuth={false} redirectTo="/dashboard">
      {children}
    </RouteGuard>
  );
}
