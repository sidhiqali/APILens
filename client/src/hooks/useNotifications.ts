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

// Query keys for React Query
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (params: any) => [...notificationQueryKeys.lists(), params] as const,
  stats: () => [...notificationQueryKeys.all, 'stats'] as const,
  preferences: () => [...notificationQueryKeys.all, 'preferences'] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unreadCount'] as const,
};

// Hook to get notifications with pagination
export const useNotifications = (params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(params || {}),
    queryFn: () => notificationService.getUserNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto refresh every minute
    retry: 3,
  });
};

// Hook for infinite scroll notifications
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

// Hook to get notification statistics
export const useNotificationStats = () => {
  return useQuery({
    queryKey: notificationQueryKeys.stats(),
    queryFn: () => notificationService.getNotificationStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3 * 60 * 1000, // Auto refresh every 3 minutes
    retry: 3,
  });
};

// Hook to get unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto refresh every minute
    retry: 3,
  });
};

// Hook to get notification preferences
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationQueryKeys.preferences(),
    queryFn: () => notificationService.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook to mark notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      // Optimistically update notification
      queryClient.setQueriesData(
        { queryKey: notificationQueryKeys.lists() },
        (oldData: PaginatedNotifications | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notifications: oldData.notifications.map((notification) =>
              notification._id === notificationId
                ? { ...notification, read: true }
                : notification
            ),
          };
        }
      );

      // Update unread count
      queryClient.setQueryData(
        notificationQueryKeys.unreadCount(),
        (oldCount: number | undefined) => Math.max(0, (oldCount || 1) - 1)
      );
    },
    onError: (error: any) => {
      // Revert optimistic update
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.error(error?.message || 'Failed to mark notification as read');
    },
    onSuccess: () => {
      // Update stats
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.stats(),
      });
    },
  });
};

// Hook to mark all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      // Optimistically update all notifications
      queryClient.setQueriesData(
        { queryKey: notificationQueryKeys.lists() },
        (oldData: PaginatedNotifications | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notifications: oldData.notifications.map((notification) => ({
              ...notification,
              read: true,
            })),
          };
        }
      );

      // Update unread count to 0
      queryClient.setQueryData(notificationQueryKeys.unreadCount(), 0);
    },
    onError: (error: any) => {
      // Revert optimistic update
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

// Hook to delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      // Get the notification to check if it was unread
      const currentData = queryClient.getQueriesData({
        queryKey: notificationQueryKeys.lists(),
      })[0]?.[1] as PaginatedNotifications | undefined;

      const notification = currentData?.notifications.find(
        (n) => n._id === notificationId
      );

      // Optimistically remove notification
      queryClient.setQueriesData(
        { queryKey: notificationQueryKeys.lists() },
        (oldData: PaginatedNotifications | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notifications: oldData.notifications.filter(
              (n) => n._id !== notificationId
            ),
            total: oldData.total - 1,
          };
        }
      );

      // Update unread count if notification was unread
      if (notification && !notification.read) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          (oldCount: number | undefined) => Math.max(0, (oldCount || 1) - 1)
        );
      }

      return { notification };
    },
    onError: (error: any) => {
      // Revert optimistic update
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

// Hook to update notification preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      notificationService.updatePreferences(preferences),
    onSuccess: (data) => {
      // Update cached preferences
      queryClient.setQueryData(notificationQueryKeys.preferences(), data);
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update preferences');
    },
  });
};

// Hook for real-time notification updates
export const useNotificationRealtime = () => {
  const queryClient = useQueryClient();

  const addNewNotification = (notification: Notification) => {
    // Add to notification list
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

    // Update unread count if notification is unread
    if (!notification.read) {
      queryClient.setQueryData(
        notificationQueryKeys.unreadCount(),
        (oldCount: number | undefined) => (oldCount || 0) + 1
      );
    }

    // Invalidate stats to get fresh data
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
