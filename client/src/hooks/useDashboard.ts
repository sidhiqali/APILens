import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { dashboardService } from '@/services/dashboard.service';
import type {
  RecentActivity,
  ApiHealthSummary,
} from '@/services/dashboard.service';

// Query keys for React Query
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardQueryKeys.all, 'overview'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  recentActivity: (limit?: number) =>
    [...dashboardQueryKeys.all, 'recentActivity', { limit }] as const,
  apiHealth: () => [...dashboardQueryKeys.all, 'apiHealth'] as const,
  criticalAlerts: (limit?: number) =>
    [...dashboardQueryKeys.all, 'criticalAlerts', { limit }] as const,
  changesTrend: (days?: number) =>
    [...dashboardQueryKeys.all, 'changesTrend', { days }] as const,
};

// Hook to get complete dashboard overview
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: dashboardQueryKeys.overview(),
    queryFn: () => dashboardService.getDashboardOverview(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto refresh every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook to get dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3 * 60 * 1000, // Auto refresh every 3 minutes
    retry: 3,
  });
};

// Hook to get recent activity
export const useRecentActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: dashboardQueryKeys.recentActivity(limit),
    queryFn: () => dashboardService.getRecentActivity(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto refresh every 2 minutes
    retry: 2,
  });
};

// Hook to get API health summary
export const useApiHealthSummary = () => {
  return useQuery({
    queryKey: dashboardQueryKeys.apiHealth(),
    queryFn: () => dashboardService.getApiHealthSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3 * 60 * 1000, // Auto refresh every 3 minutes
    retry: 3,
  });
};

// Hook to get critical alerts
export const useCriticalAlerts = (limit: number = 5) => {
  return useQuery({
    queryKey: dashboardQueryKeys.criticalAlerts(limit),
    queryFn: () => dashboardService.getCriticalAlerts(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto refresh every 2 minutes
    retry: 3,
  });
};

// Hook to get API changes trend
export const useApiChangesTrend = (days: number = 30) => {
  return useQuery({
    queryKey: dashboardQueryKeys.changesTrend(days),
    queryFn: () => dashboardService.getApiChangesTrend(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Hook to refresh all dashboard data
export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all dashboard queries
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.all,
      });

      // Force refetch critical queries
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: dashboardQueryKeys.stats(),
        }),
        queryClient.refetchQueries({
          queryKey: dashboardQueryKeys.recentActivity(),
        }),
        queryClient.refetchQueries({
          queryKey: dashboardQueryKeys.apiHealth(),
        }),
      ]);
    },
    onSuccess: () => {
      toast.success('Dashboard refreshed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to refresh dashboard');
    },
  });
};

// Hook for real-time dashboard updates
export const useDashboardRealtime = () => {
  const queryClient = useQueryClient();

  const invalidateStats = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.stats(),
    });
  };

  const invalidateActivity = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.recentActivity(),
    });
  };

  const invalidateHealth = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.apiHealth(),
    });
  };

  const invalidateAlerts = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.criticalAlerts(),
    });
  };

  const addRecentActivity = (activity: RecentActivity) => {
    queryClient.setQueryData(
      dashboardQueryKeys.recentActivity(10),
      (oldData: RecentActivity[] | undefined) => {
        if (!oldData) return [activity];
        return [activity, ...oldData].slice(0, 10);
      }
    );
  };

  const updateApiHealth = (apiId: string, status: string) => {
    queryClient.setQueryData(
      dashboardQueryKeys.apiHealth(),
      (oldData: ApiHealthSummary[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((api) =>
          api.id === apiId ? { ...api, status: status as any } : api
        );
      }
    );
  };

  return {
    invalidateStats,
    invalidateActivity,
    invalidateHealth,
    invalidateAlerts,
    addRecentActivity,
    updateApiHealth,
  };
};
