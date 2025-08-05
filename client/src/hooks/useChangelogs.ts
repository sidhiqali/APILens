import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { changelogService } from '@/services/changelog.service';
import type { ApiChange, Changelog } from '@/services/changelog.service';

// Query keys for React Query
export const changelogQueryKeys = {
  all: ['changelogs'] as const,
  apiChanges: (apiId: string) =>
    [...changelogQueryKeys.all, 'changes', apiId] as const,
  apiSnapshots: (apiId: string) =>
    [...changelogQueryKeys.all, 'snapshots', apiId] as const,
  changelog: (apiId: string) =>
    [...changelogQueryKeys.all, 'changelog', apiId] as const,
  changelogDetail: (apiId: string, changelogId: string) =>
    [...changelogQueryKeys.changelog(apiId), changelogId] as const,
  comparison: (apiId: string, fromVersion: string, toVersion: string) =>
    [
      ...changelogQueryKeys.all,
      'compare',
      apiId,
      fromVersion,
      toVersion,
    ] as const,
  stats: (apiId: string) =>
    [...changelogQueryKeys.all, 'stats', apiId] as const,
};

// Hook to get API changes
export const useApiChanges = (
  apiId: string,
  params?: {
    page?: number;
    limit?: number;
    severity?: string;
    changeType?: string;
  }
) => {
  return useQuery({
    queryKey: changelogQueryKeys.apiChanges(apiId),
    queryFn: () => changelogService.getApiChanges(apiId, params),
    enabled: !!apiId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
};

// Hook to get API snapshots
export const useApiSnapshots = (apiId: string, limit: number = 10) => {
  return useQuery({
    queryKey: changelogQueryKeys.apiSnapshots(apiId),
    queryFn: () => changelogService.getApiSnapshots(apiId, limit),
    enabled: !!apiId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

// Hook to get API changelogs
export const useApiChangelogs = (
  apiId: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: changelogQueryKeys.changelog(apiId),
    queryFn: () => changelogService.getApiChangelogs(apiId, page, limit),
    enabled: !!apiId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
};

// Hook to get specific changelog
export const useChangelog = (apiId: string, changelogId: string) => {
  return useQuery({
    queryKey: changelogQueryKeys.changelogDetail(apiId, changelogId),
    queryFn: () => changelogService.getChangelog(apiId, changelogId),
    enabled: !!apiId && !!changelogId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Hook to compare API versions
export const useVersionComparison = (
  apiId: string,
  fromVersion: string,
  toVersion: string
) => {
  return useQuery({
    queryKey: changelogQueryKeys.comparison(apiId, fromVersion, toVersion),
    queryFn: () =>
      changelogService.compareVersions(apiId, fromVersion, toVersion),
    enabled: !!apiId && !!fromVersion && !!toVersion,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Hook to get change statistics
export const useChangeStats = (apiId: string, timeRange: string = '30d') => {
  return useQuery({
    queryKey: changelogQueryKeys.stats(apiId),
    queryFn: () => changelogService.getChangeStats(apiId, timeRange),
    enabled: !!apiId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook to create changelog
export const useCreateChangelog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      apiId,
      changelogData,
    }: {
      apiId: string;
      changelogData: {
        title: string;
        description: string;
        version: string;
        changes: string[];
      };
    }) => changelogService.createChangelog(apiId, changelogData),
    onSuccess: (data, variables) => {
      // Invalidate changelogs for this API
      queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.changelog(variables.apiId),
      });

      // Add the new changelog to the cache
      queryClient.setQueryData(
        changelogQueryKeys.changelog(variables.apiId),
        (oldData: Changelog[] | undefined) => {
          if (!oldData) return [data];
          return [data, ...oldData];
        }
      );

      toast.success('Changelog created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create changelog');
    },
  });
};

// Hook to update changelog
export const useUpdateChangelog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      apiId,
      changelogId,
      changelogData,
    }: {
      apiId: string;
      changelogId: string;
      changelogData: {
        title?: string;
        description?: string;
        version?: string;
        changes?: string[];
      };
    }) => changelogService.updateChangelog(apiId, changelogId, changelogData),
    onSuccess: (data, variables) => {
      // Update the specific changelog in cache
      queryClient.setQueryData(
        changelogQueryKeys.changelogDetail(
          variables.apiId,
          variables.changelogId
        ),
        data
      );

      // Invalidate the changelog list
      queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.changelog(variables.apiId),
      });

      toast.success('Changelog updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update changelog');
    },
  });
};

// Hook to delete changelog
export const useDeleteChangelog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      apiId,
      changelogId,
    }: {
      apiId: string;
      changelogId: string;
    }) => changelogService.deleteChangelog(apiId, changelogId),
    onMutate: async ({ apiId, changelogId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: changelogQueryKeys.changelog(apiId),
      });

      // Optimistically remove the changelog
      queryClient.setQueryData(
        changelogQueryKeys.changelog(apiId),
        (oldData: Changelog[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter((changelog) => changelog._id !== changelogId);
        }
      );
    },
    onError: (error: any, variables) => {
      // Revert optimistic update
      queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.changelog(variables.apiId),
      });
      toast.error(error?.message || 'Failed to delete changelog');
    },
    onSuccess: (_, variables) => {
      toast.success('Changelog deleted successfully');

      // Remove from detailed cache
      queryClient.removeQueries({
        queryKey: changelogQueryKeys.changelogDetail(
          variables.apiId,
          variables.changelogId
        ),
      });
    },
  });
};

// Hook to export changelogs
export const useExportChangelogs = () => {
  return useMutation({
    mutationFn: (apiId: string) => changelogService.exportChangelogs(apiId),
    onSuccess: (blob, apiId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `api-${apiId}-changelogs.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Changelogs exported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to export changelogs');
    },
  });
};

// Hook for real-time changelog updates
export const useChangelogRealtime = () => {
  const queryClient = useQueryClient();

  const addNewChange = (apiId: string, change: ApiChange) => {
    // Add to changes list
    queryClient.setQueryData(
      changelogQueryKeys.apiChanges(apiId),
      (oldData: ApiChange[] | undefined) => {
        if (!oldData) return [change];
        return [change, ...oldData];
      }
    );

    // Invalidate related queries
    queryClient.invalidateQueries({
      queryKey: changelogQueryKeys.stats(apiId),
    });
  };

  const invalidateChanges = (apiId: string) => {
    queryClient.invalidateQueries({
      queryKey: changelogQueryKeys.apiChanges(apiId),
    });
  };

  const invalidateSnapshots = (apiId: string) => {
    queryClient.invalidateQueries({
      queryKey: changelogQueryKeys.apiSnapshots(apiId),
    });
  };

  return {
    addNewChange,
    invalidateChanges,
    invalidateSnapshots,
  };
};
