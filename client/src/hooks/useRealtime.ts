import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { socketService } from '@/services/socket.service';
import { useAuth } from '@/store/auth';
import { useDashboardRealtime } from './useDashboard';
import { useNotificationRealtime } from './useNotifications';
import { useChangelogRealtime } from './useChangelogs';
import type { SocketEvents } from '@/services/socket.service';

// Hook for managing real-time connections
export const useRealtime = () => {
  const { user, isAuthenticated } = useAuth();
  const isConnectedRef = useRef(false);

  // Real-time update hooks
  const dashboardRealtime = useDashboardRealtime();
  const notificationRealtime = useNotificationRealtime();
  const changelogRealtime = useChangelogRealtime();

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isConnectedRef.current) {
      socketService.connect(user._id);
      isConnectedRef.current = true;

      // Join user-specific room
      if (socketService.isConnected) {
        socketService.joinUserRoom(user._id);
      }
    }

    return () => {
      if (!isAuthenticated && isConnectedRef.current) {
        socketService.disconnect();
        isConnectedRef.current = false;
      }
    };
  }, [isAuthenticated, user]);

  // Handle API change events
  const handleApiChange = useCallback(
    (data: Parameters<SocketEvents['api-change']>[0]) => {
      // Add to recent activity
      dashboardRealtime.addRecentActivity({
        id: `change-${Date.now()}`,
        type: 'api_change',
        title: 'API Change Detected',
        description: `${data.changes.length} changes detected in ${data.apiName}`,
        timestamp: data.timestamp,
        apiId: data.apiId,
        apiName: data.apiName,
        severity: data.severity as any,
      });

      // Add to changelog
      changelogRealtime.addNewChange(data.apiId, {
        _id: `change-${Date.now()}`,
        apiId: data.apiId,
        changeType: data.severity === 'critical' ? 'breaking' : 'non-breaking',
        severity: data.severity as any,
        changes: data.changes,
        detectedAt: data.timestamp,
        summary: `${data.changes.length} changes detected`,
        impactScore: data.severity === 'critical' ? 10 : 5,
      });

      // Invalidate dashboard stats
      dashboardRealtime.invalidateStats();

      // Show toast notification
      const message = `${data.changes.length} changes detected in ${data.apiName}`;
      if (data.severity === 'critical') {
        toast.error(message, { duration: 10000 });
      } else {
        toast.success(message);
      }
    },
    [dashboardRealtime, changelogRealtime]
  );

  // Handle API health update events
  const handleApiHealthUpdate = useCallback(
    (data: Parameters<SocketEvents['api-health-update']>[0]) => {
      // Update API health in dashboard
      dashboardRealtime.updateApiHealth(data.apiId, data.status);

      // Add to recent activity
      dashboardRealtime.addRecentActivity({
        id: `health-${Date.now()}`,
        type: 'api_health',
        title: 'API Health Update',
        description: `${data.apiName} status changed from ${data.previousStatus} to ${data.status}`,
        timestamp: data.timestamp,
        apiId: data.apiId,
        apiName: data.apiName,
        severity: data.status === 'unhealthy' ? 'high' : 'low',
      });

      // Invalidate health data
      dashboardRealtime.invalidateHealth();

      // Show toast notification
      if (data.status === 'unhealthy') {
        toast.error(`${data.apiName} is now unhealthy`);
      } else if (
        data.status === 'healthy' &&
        data.previousStatus === 'unhealthy'
      ) {
        toast.success(`${data.apiName} is now healthy`);
      }
    },
    [dashboardRealtime]
  );

  // Handle notification events
  const handleNotification = useCallback(
    (data: Parameters<SocketEvents['notification']>[0]) => {
      // Add notification to the store
      notificationRealtime.addNewNotification({
        _id: data.id,
        userId: user?._id || '',
        type: data.type as any,
        title: data.title,
        message: data.message,
        severity: data.severity as any,
        read: false,
        channels: ['web'],
        deliveryStatus: {},
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
      });

      // Show toast notification
      const toastMessage = `${data.title}: ${data.message}`;
      switch (data.severity) {
        case 'critical':
          toast.error(toastMessage, { duration: 10000 });
          break;
        case 'high':
          toast.error(toastMessage, { duration: 7000 });
          break;
        case 'medium':
          toast(toastMessage, { duration: 5000 });
          break;
        default:
          toast.success(toastMessage);
          break;
      }
    },
    [notificationRealtime, user]
  );

  // Handle API check complete events
  const handleApiCheckComplete = useCallback(
    (data: Parameters<SocketEvents['api-check-complete']>[0]) => {
      // Invalidate API-related queries
      changelogRealtime.invalidateChanges(data.apiId);
      dashboardRealtime.invalidateStats();

      // Add activity if changes were found
      if (data.hasChanges) {
        dashboardRealtime.addRecentActivity({
          id: `check-${Date.now()}`,
          type: 'api_change',
          title: 'API Check Complete',
          description: `${data.changeCount} changes found`,
          timestamp: data.timestamp,
          apiId: data.apiId,
          severity: data.changeCount > 0 ? 'medium' : 'low',
        });
      }
    },
    [dashboardRealtime, changelogRealtime]
  );

  // Setup event listeners
  useEffect(() => {
    if (socketService.isConnected) {
      socketService.on('api-change', handleApiChange);
      socketService.on('api-health-update', handleApiHealthUpdate);
      socketService.on('notification', handleNotification);
      socketService.on('api-check-complete', handleApiCheckComplete);

      return () => {
        socketService.off('api-change', handleApiChange);
        socketService.off('api-health-update', handleApiHealthUpdate);
        socketService.off('notification', handleNotification);
        socketService.off('api-check-complete', handleApiCheckComplete);
      };
    }
    return undefined;
  }, [
    handleApiChange,
    handleApiHealthUpdate,
    handleNotification,
    handleApiCheckComplete,
  ]);

  return {
    isConnected: socketService.isConnected,
    socketId: socketService.socketId,
    joinApiRoom: socketService.joinApiRoom.bind(socketService),
    leaveApiRoom: socketService.leaveApiRoom.bind(socketService),
  };
};

// Hook for specific API real-time updates
export const useApiRealtime = (apiId: string) => {
  const { joinApiRoom, leaveApiRoom } = useRealtime();

  useEffect(() => {
    if (apiId) {
      joinApiRoom(apiId);
      return () => leaveApiRoom(apiId);
    }
    return undefined;
  }, [apiId, joinApiRoom, leaveApiRoom]);

  return {
    apiId,
  };
};

// Hook for connection status
export const useConnectionStatus = () => {
  const { isConnected } = useRealtime();

  return {
    isConnected,
    status: isConnected ? 'connected' : 'disconnected',
  };
};

// Hook for real-time dashboard updates
export const useRealTimeDashboard = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Connect to real-time dashboard updates
    socketService.connect();

    // Set up event listeners for dashboard-specific events
    const handleApiChange = () => {
      // Invalidate dashboard queries when API changes occur
      // This will be implemented when we integrate with React Query
    };

    socketService.on('api-change', handleApiChange);

    return () => {
      socketService.off('api-change', handleApiChange);
    };
  }, [user]);

  return undefined;
};
