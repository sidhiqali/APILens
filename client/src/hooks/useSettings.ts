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

export const settingsQueryKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsQueryKeys.all, 'profile'] as const,
  notificationPreferences: () =>
    [...settingsQueryKeys.all, 'notificationPreferences'] as const,
  apiSettings: (apiId: string) =>
    [...settingsQueryKeys.all, 'apiSettings', apiId] as const,
  systemSettings: () => [...settingsQueryKeys.all, 'systemSettings'] as const,
  apiKey: () => [...settingsQueryKeys.all, 'apiKey'] as const,
};

export const useProfile = () => {
  return useQuery({
    queryKey: settingsQueryKeys.profile(),
    queryFn: () => settingsService.getProfile(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      settingsService.updateProfile(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.profile(),
      });

      queryClient.setQueryData(
        settingsQueryKeys.profile(),
        (oldData: UserProfile | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...data };
        }
      );
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.profile(),
      });
      toast.error(error?.message || 'Failed to update profile');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.profile(), data);
      toast.success('Profile updated successfully');
    },
  });
};

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

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: settingsQueryKeys.notificationPreferences(),
    queryFn: () => settingsService.getNotificationPreferences(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      settingsService.updateNotificationPreferences(preferences),
    onMutate: async (preferences) => {
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.notificationPreferences(),
      });

      queryClient.setQueryData(
        settingsQueryKeys.notificationPreferences(),
        preferences
      );
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.notificationPreferences(),
      });
      toast.error(
        error?.message || 'Failed to update notification preferences'
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        settingsQueryKeys.notificationPreferences(),
        data
      );
      toast.success('Notification preferences updated');
    },
  });
};

export const useApiSettings = (apiId: string) => {
  return useQuery({
    queryKey: settingsQueryKeys.apiSettings(apiId),
    queryFn: () => settingsService.getApiSettings(apiId),
    enabled: !!apiId,
    staleTime: 3 * 60 * 1000,
    retry: 2,
  });
};

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
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.apiSettings(apiId),
      });

      queryClient.setQueryData(
        settingsQueryKeys.apiSettings(apiId),
        (oldData: ApiSettings | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...settings };
        }
      );
    },
    onError: (error: any, { apiId }) => {
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.apiSettings(apiId),
      });
      toast.error(error?.message || 'Failed to update API settings');
    },
    onSuccess: (data, { apiId }) => {
      queryClient.setQueryData(settingsQueryKeys.apiSettings(apiId), data);
      toast.success('API settings updated');
    },
  });
};

export const useSystemSettings = () => {
  return useQuery({
    queryKey: settingsQueryKeys.systemSettings(),
    queryFn: () => settingsService.getSystemSettings(),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};

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
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.systemSettings(),
      });

      queryClient.setQueryData(
        settingsQueryKeys.systemSettings(),
        (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, ...settings };
        }
      );
    },
    onError: (error: any) => {
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

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: () => settingsService.deleteAccount(),
    onSuccess: () => {
      toast.success('Account deleted successfully');
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete account');
    },
  });
};

export const useExportUserData = () => {
  return useMutation({
    mutationFn: () => settingsService.exportUserData(),
    onSuccess: (blob) => {
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

export const useApiKey = () => {
  return useQuery({
    queryKey: settingsQueryKeys.apiKey(),
    queryFn: () => settingsService.getApiKey(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useGenerateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsService.generateApiKey(),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.apiKey(), data);
      toast.success('API key generated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to generate API key');
    },
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsService.revokeApiKey(),
    onSuccess: () => {
      queryClient.setQueryData(settingsQueryKeys.apiKey(), { apiKey: null });
      toast.success('API key revoked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to revoke API key');
    },
  });
};
