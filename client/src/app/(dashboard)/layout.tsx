'use client';

import RouteGuard from '@/components/RouteGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteGuard requireAuth={true}>{children}</RouteGuard>;
}
