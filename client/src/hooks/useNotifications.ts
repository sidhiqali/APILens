import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { notificationService } from '@/services/notification.service';
import type {
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
} from '@/services/notification.service';

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (params: any) => [...notificationQueryKeys.lists(), params] as const,
  stats: () => [...notificationQueryKeys.all, 'stats'] as const,
  preferences: () => [...notificationQueryKeys.all, 'preferences'] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unreadCount'] as const,
};

export const useNotifications = (params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(params || {}),
    queryFn: () => notificationService.getUserNotifications(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 3,
  });
};

export const useInfiniteNotifications = (params?: {
  limit?: number;
  unreadOnly?: boolean;
}) => {
  const limit = params?.limit || 20;

  return useInfiniteQuery({
    queryKey: notificationQueryKeys.list({ ...params, infinite: true }),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      notificationService.getUserNotifications({
        ...params,
        limit,
        offset: pageParam * limit,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedNotifications, allPages) => {
      const totalFetched = allPages.length * limit;
      return totalFetched < lastPage.total ? allPages.length : undefined;
    },
    staleTime: 30 * 1000,
    retry: 2,
  });
};

export const useNotificationStats = () => {
  return useQuery({
    queryKey: notificationQueryKeys.stats(),
    queryFn: () => notificationService.getNotificationStats(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
    retry: 3,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 3,
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationQueryKeys.preferences(),
    queryFn: () => notificationService.getPreferences(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      queryClient.setQueriesData(
        { queryKey: notificationQueryKeys.lists() },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: PaginatedNotifications) => ({
              ...page,
              notifications: page.notifications?.map((notification) =>
                notification._id === notificationId
                  ? { ...notification, read: true }
                  : notification
              ) || [],
            })),
          };
        }
      );

      queryClient.setQueryData(
        notificationQueryKeys.unreadCount(),
        (oldCount: number | undefined) => Math.max(0, (oldCount || 1) - 1)
      );
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.error(error?.message || 'Failed to mark notification as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.stats(),
      });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      queryClient.setQueriesData(
        { queryKey: notificationQueryKeys.lists() },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: PaginatedNotifications) => ({
              ...page,
              notifications: page.notifications?.map((notification) => ({
                ...notification,
                read: true,
              })) || [],
            })),
          };
        }
      );

      queryClient.setQueryData(notificationQueryKeys.unreadCount(), 0);
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.error(error?.message || 'Failed to mark all notifications as read');
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.stats(),
      });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      const allQueriesData = queryClient.getQueriesData({
        queryKey: notificationQueryKeys.lists(),
      });
      
      let notification: any = null;
      for (const [, data] of allQueriesData) {
        if (data && (data as any).pages) {
          for (const page of (data as any).pages) {
            if (page.notifications) {
              notification = page.notifications.find((n: any) => n._id === notificationId);
              if (notification) break;
            }
          }
          if (notification) break;
        }
      }

      queryClient.setQueriesData(
        { queryKey: notificationQueryKeys.lists() },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: PaginatedNotifications) => ({
              ...page,
              notifications: page.notifications?.filter(
                (n) => n._id !== notificationId
              ) || [],
              total: Math.max(0, (page.total || 1) - 1),
            })),
          };
        }
      );

      if (notification && !notification.read) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          (oldCount: number | undefined) => Math.max(0, (oldCount || 1) - 1)
        );
      }

      return { notification };
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.error(error?.message || 'Failed to delete notification');
    },
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.stats(),
      });
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      notificationService.updatePreferences(preferences),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationQueryKeys.preferences(), data);
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update preferences');
    },
  });
};

export const useNotificationRealtime = () => {
  const queryClient = useQueryClient();

  const addNewNotification = (notification: Notification) => {
    queryClient.setQueriesData(
      { queryKey: notificationQueryKeys.lists() },
      (oldData: PaginatedNotifications | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: [notification, ...oldData.notifications],
          total: oldData.total + 1,
        };
      }
    );

    if (!notification.read) {
      queryClient.setQueryData(
        notificationQueryKeys.unreadCount(),
        (oldCount: number | undefined) => (oldCount || 0) + 1
      );
    }

    queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.stats(),
    });
  };

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.all,
    });
  };

  return {
    addNewNotification,
    invalidateNotifications,
  };
};
