/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiService } from '@/services/api.service';
import { dashboardService } from '@/services/dashboard.service';
import { dashboardQueryKeys } from '@/hooks/useDashboard';
import type { CheckNowResponse } from '@/types';
import { CreateApiRequest, UpdateApiRequest } from '@/types';

export const apiQueryKeys = {
  all: ['apis'] as const,
  lists: () => [...apiQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) =>
    [...apiQueryKeys.lists(), filters] as const,
  details: () => [...apiQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiQueryKeys.details(), id] as const,
  stats: () => [...apiQueryKeys.all, 'stats'] as const,
  dashboardStats: () => [...apiQueryKeys.stats(), 'dashboard'] as const,
  apiStats: (id: string) => [...apiQueryKeys.stats(), id] as const,
  changes: (id: string) => [...apiQueryKeys.all, 'changes', id] as const,
  snapshots: (id: string) => [...apiQueryKeys.all, 'snapshots', id] as const,
  tags: () => [...apiQueryKeys.all, 'tags'] as const,
  health: (id: string) => [...apiQueryKeys.all, 'health', id] as const,
};

export const useApis = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  status?: 'all' | 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: apiQueryKeys.list(params || {}),
    queryFn: () => apiService.getApis(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useApi = (id: string) => {
  return useQuery({
    queryKey: apiQueryKeys.detail(id),
    queryFn: () => apiService.getApiById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: apiQueryKeys.dashboardStats(),
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useApiStats = (id: string, timeRange?: string) => {
  return useQuery({
    queryKey: apiQueryKeys.apiStats(id),
    queryFn: () => apiService.getApiStats(id, timeRange),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useApiChanges = (
  id: string,
  params?: {
    page?: number;
    limit?: number;
    severity?: string;
    changeType?: string;
  }
) => {
  return useQuery({
    queryKey: apiQueryKeys.changes(id),
    queryFn: () => apiService.getApiChanges(id, params),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
};

export const useTags = () => {
  return useQuery({
    queryKey: apiQueryKeys.tags(),
    queryFn: () => apiService.getTags(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateApi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiRequest) => apiService.createApi(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.dashboardStats(),
        });
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.tags() });
        toast.success('API registered successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create API');
    },
  });
};

export const useUpdateApi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApiRequest }) =>
      apiService.updateApi(id, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.detail(variables.id),
        });
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.dashboardStats(),
        });
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.tags() });
        toast.success('API updated successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update API');
    },
  });
};

export const useDeleteApi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteApi(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.lists() });
      
      const previousApis = queryClient.getQueryData(apiQueryKeys.lists());
      
      const apis = previousApis as any[];
      const apiToDelete = apis?.find((api: any) => api.id === id);
      
      queryClient.setQueriesData(
        { queryKey: apiQueryKeys.lists() },
        (old: any) => {
          if (!old) return old;
          return old.filter((api: any) => api.id !== id);
        }
      );
      
      return { previousApis, apiName: apiToDelete?.apiName };
    },
    onError: (err: any, _id, context: any) => {
      if (context?.previousApis) {
        queryClient.setQueryData(apiQueryKeys.lists(), context.previousApis);
      }
      toast.error(err.response?.data?.message || 'Failed to delete API');
    },
    onSuccess: (response, id, context: any) => {
      if (response.success) {
        queryClient.removeQueries({ queryKey: apiQueryKeys.detail(id) });
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.dashboardStats(),
        });
        
        const apiName = context?.apiName || 'API';
        toast.success(`"${apiName}" has been deleted successfully`);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
    },
  });
};

export const useToggleApiStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.toggleApiStatus(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.lists() });
      
      const previousApis = queryClient.getQueryData(apiQueryKeys.lists());
      
      queryClient.setQueriesData(
        { queryKey: apiQueryKeys.lists() },
        (old: any) => {
          if (!old) return old;
          return old.map((api: any) => 
            api.id === id ? { ...api, isActive: !api.isActive } : api
          );
        }
      );
      
      return { previousApis };
    },
    onError: (err: any, _id, context: any) => {
      if (context?.previousApis) {
        queryClient.setQueryData(apiQueryKeys.lists(), context.previousApis);
      }
      toast.error(
        err.response?.data?.message || 'Failed to update API status'
      );
    },
    onSuccess: (response, id) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.detail(id) });
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.dashboardStats(),
        });
        
        const apiData = response.data;
        const message = apiData?.isActive 
          ? `API "${apiData?.apiName || 'API'}" has been activated` 
          : `API "${apiData?.apiName || 'API'}" has been paused`;
        toast.success(message);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
    },
  });
};

export const useCheckApi = () => {
  const queryClient = useQueryClient();

  return useMutation<CheckNowResponse, unknown, string, { apiName?: string }>({
    mutationFn: (id: string) => apiService.checkNow(id),
    onMutate: async (id) => {
      const apis = queryClient.getQueryData(apiQueryKeys.lists()) as any[];
      const api = apis?.find((api: any) => api.id === id);
      return { apiName: api?.apiName };
    },
    onSuccess: (response, id, context) => {
      const apiName = context?.apiName || 'API';
      const changesCount = Array.isArray(response?.changes)
        ? response.changes!.length
        : 0;
      const hasChanges = Boolean(response?.hasChanges);
      if (hasChanges) {
        // Refresh related API data
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.changes(id) });
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });

        // invalidate legacy/simple keys used by detail pages
        queryClient.invalidateQueries({ queryKey: ['apiChanges', id] });
        queryClient.invalidateQueries({ queryKey: ['changelog', id] });
        queryClient.invalidateQueries({ queryKey: ['apiSnapshots', id] });
        queryClient.invalidateQueries({ queryKey: ['apiIssues', id] });

        // Refresh dashboard stats regardless of which hook the page uses
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.dashboardStats() });
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.stats() });
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.recentActivity() });
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.apiHealth() });
      }

      if (hasChanges) {
        toast.success(`"${apiName}": ${changesCount} change${changesCount === 1 ? '' : 's'} detected`);
      } else {
        toast.success('No changes detected');
      }
    },
    onError: (error: any, _id, context: any) => {
      const apiName = context?.apiName || 'API';
      toast.error(error.response?.data?.message || `Failed to check "${apiName}"`);
    },
  });
};

export const useValidateApiUrl = () => {
  return useMutation({
    mutationFn: (url: string) => apiService.validateApiUrl(url),
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to validate API URL'
      );
    },
  });
};

export const useGetApis = useApis;
export const useGetApiStats = useDashboardStats;
export const useGetApi = useApi;
export const useToggleApi = useToggleApiStatus;
