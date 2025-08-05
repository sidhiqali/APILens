import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { settingsService } from '@/services/settings.service';
import type {
  UserProfile,
  NotificationPreferences,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ApiSettings,
} from '@/services/settings.service';

// Query keys for React Query
export const settingsQueryKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsQueryKeys.all, 'profile'] as const,
  notificationPreferences: () => [...settingsQueryKeys.all, 'notificationPreferences'] as const,
  apiSettings: (apiId: string) => [...settingsQueryKeys.all, 'apiSettings', apiId] as const,
  systemSettings: () => [...settingsQueryKeys.all, 'systemSettings'] as const,
  apiKey: () => [...settingsQueryKeys.all, 'apiKey'] as const,
};

// Hook to get user profile
export const useProfile = () => {
  return useQuery({
    queryKey: settingsQueryKeys.profile(),
    queryFn: () => settingsService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook to update profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      settingsService.updateProfile(data),
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.profile(),
      });

      // Optimistically update profile
      queryClient.setQueryData(
        settingsQueryKeys.profile(),
        (oldData: UserProfile | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...data };
        }
      );
    },
    onError: (error: any) => {
      // Revert optimistic update
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.profile(),
      });
      toast.error(error?.message || 'Failed to update profile');
    },
    onSuccess: (data) => {
      // Update cached profile
      queryClient.setQueryData(settingsQueryKeys.profile(), data);
      toast.success('Profile updated successfully');
    },
  });
};

// Hook to change password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      settingsService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to change password');
    },
  });
};

// Hook to get notification preferences
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: settingsQueryKeys.notificationPreferences(),
    queryFn: () => settingsService.getNotificationPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook to update notification preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      settingsService.updateNotificationPreferences(preferences),
    onMutate: async (preferences) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.notificationPreferences(),
      });

      // Optimistically update preferences
      queryClient.setQueryData(
        settingsQueryKeys.notificationPreferences(),
        preferences
      );
    },
    onError: (error: any) => {
      // Revert optimistic update
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.notificationPreferences(),
      });
      toast.error(error?.message || 'Failed to update notification preferences');
    },
    onSuccess: (data) => {
      // Update cached preferences
      queryClient.setQueryData(settingsQueryKeys.notificationPreferences(), data);
      toast.success('Notification preferences updated');
    },
  });
};

// Hook to get API settings
export const useApiSettings = (apiId: string) => {
  return useQuery({
    queryKey: settingsQueryKeys.apiSettings(apiId),
    queryFn: () => settingsService.getApiSettings(apiId),
    enabled: !!apiId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
};

// Hook to update API settings
export const useUpdateApiSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      apiId,
      settings,
    }: {
      apiId: string;
      settings: Partial<ApiSettings>;
    }) => settingsService.updateApiSettings(apiId, settings),
    onMutate: async ({ apiId, settings }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.apiSettings(apiId),
      });

      // Optimistically update settings
      queryClient.setQueryData(
        settingsQueryKeys.apiSettings(apiId),
        (oldData: ApiSettings | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...settings };
        }
      );
    },
    onError: (error: any, { apiId }) => {
      // Revert optimistic update
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.apiSettings(apiId),
      });
      toast.error(error?.message || 'Failed to update API settings');
    },
    onSuccess: (data, { apiId }) => {
      // Update cached settings
      queryClient.setQueryData(settingsQueryKeys.apiSettings(apiId), data);
      toast.success('API settings updated');
    },
  });
};

// Hook to get system settings
export const useSystemSettings = () => {
  return useQuery({
    queryKey: settingsQueryKeys.systemSettings(),
    queryFn: () => settingsService.getSystemSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

// Hook to update system settings
export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: {
      theme?: 'light' | 'dark' | 'system';
      language?: string;
      timezone?: string;
      dateFormat?: string;
    }) => settingsService.updateSystemSettings(settings),
    onMutate: async (settings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.systemSettings(),
      });

      // Optimistically update settings
      queryClient.setQueryData(
        settingsQueryKeys.systemSettings(),
        (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, ...settings };
        }
      );
    },
    onError: (error: any) => {
      // Revert optimistic update
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.systemSettings(),
      });
      toast.error(error?.message || 'Failed to update system settings');
    },
    onSuccess: () => {
      toast.success('System settings updated');
    },
  });
};

// Hook to delete account
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: () => settingsService.deleteAccount(),
    onSuccess: () => {
      toast.success('Account deleted successfully');
      // Redirect to home page or login
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete account');
    },
  });
};

// Hook to export user data
export const useExportUserData = () => {
  return useMutation({
    mutationFn: () => settingsService.exportUserData(),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apilens-user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('User data exported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to export user data');
    },
  });
};

// Hook to get API key
export const useApiKey = () => {
  return useQuery({
    queryKey: settingsQueryKeys.apiKey(),
    queryFn: () => settingsService.getApiKey(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook to generate API key
export const useGenerateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsService.generateApiKey(),
    onSuccess: (data) => {
      // Update cached API key
      queryClient.setQueryData(settingsQueryKeys.apiKey(), data);
      toast.success('API key generated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to generate API key');
    },
  });
};

// Hook to revoke API key
export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsService.revokeApiKey(),
    onSuccess: () => {
      // Update cached API key to null
      queryClient.setQueryData(settingsQueryKeys.apiKey(), { apiKey: null });
      toast.success('API key revoked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to revoke API key');
    },
  });
};
