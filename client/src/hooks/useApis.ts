import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiService } from '@/services/api.service';
import { dashboardService } from '@/services/dashboard.service';
import { CreateApiRequest, UpdateApiRequest } from '@/types';

// Query keys for React Query
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

// Hook to get all APIs with filtering and pagination
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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get single API
export const useApi = (id: string) => {
  return useQuery({
    queryKey: apiQueryKeys.detail(id),
    queryFn: () => apiService.getApiById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to get dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: apiQueryKeys.dashboardStats(),
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto refresh every 5 minutes
  });
};

// Hook to get API stats
export const useApiStats = (id: string, timeRange?: string) => {
  return useQuery({
    queryKey: apiQueryKeys.apiStats(id),
    queryFn: () => apiService.getApiStats(id, timeRange),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get API changes
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
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to get all tags
export const useTags = () => {
  return useQuery({
    queryKey: apiQueryKeys.tags(),
    queryFn: () => apiService.getTags(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to create API
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

// Hook to update API
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

// Hook to delete API
export const useDeleteApi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteApi(id),
    onSuccess: (response, id) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
        queryClient.removeQueries({ queryKey: apiQueryKeys.detail(id) });
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.dashboardStats(),
        });
        toast.success('API deleted successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete API');
    },
  });
};

// Hook to toggle API status
export const useToggleApiStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.toggleApiStatus(id),
    onSuccess: (response, id) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.detail(id) });
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.dashboardStats(),
        });
        toast.success('API status updated successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update API status'
      );
    },
  });
};

// Hook to manually check API
export const useCheckApi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.checkApi(id),
    onSuccess: (response, id) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.changes(id) });
        toast.success('API check completed!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check API');
    },
  });
};

// Hook to validate API URL (for API registration form)
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

// Legacy exports for backward compatibility
export const useGetApis = useApis;
export const useGetApiStats = useDashboardStats;
export const useGetApi = useApi;
export const useToggleApi = useToggleApiStatus;
