'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket, useWebSocketEvent } from './WebSocketProvider';
import { toast } from 'react-hot-toast';

// Real-time event types
export interface RealtimeAPIUpdate {
  apiId: string;
  apiName: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  responseTime?: number;
  uptime?: number;
  lastChecked: string;
  changes?: any[];
}

export interface RealtimeNotification {
  id: string;
  userId: string;
  apiId?: string;
  type: 'api_change' | 'api_error' | 'api_recovered' | 'system' | 'breaking_change';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
  createdAt: string;
}

export interface RealtimeAPIChange {
  id: string;
  apiId: string;
  apiName: string;
  changeType: 'schema' | 'endpoint' | 'response' | 'breaking';
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  details: any;
  timestamp: string;
}

export interface RealtimeMetrics {
  apiId: string;
  metrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    requestCount: number;
    timestamp: string;
  };
}

interface RealtimeContextType {
  // Connection state
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  
  // Event handlers
  onAPIUpdate: (callback: (update: RealtimeAPIUpdate) => void) => () => void;
  onNotification: (callback: (notification: RealtimeNotification) => void) => () => void;
  onAPIChange: (callback: (change: RealtimeAPIChange) => void) => () => void;
  onMetricsUpdate: (callback: (metrics: RealtimeMetrics) => void) => () => void;
  
  // Subscription management
  subscribeToAPI: (apiId: string) => void;
  unsubscribeFromAPI: (apiId: string) => void;
  subscribedAPIs: string[];
  
  // Statistics
  stats: {
    eventsReceived: number;
    lastEventTime: string | null;
  };
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;
  autoSubscribeToUserAPIs?: boolean;
  enableToastNotifications?: boolean;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  autoSubscribeToUserAPIs = true,
  enableToastNotifications = true,
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [subscribedAPIs, setSubscribedAPIs] = useState<string[]>([]);
  const [stats, setStats] = useState({
    eventsReceived: 0,
    lastEventTime: null as string | null,
  });

  const { isConnected, emit } = useWebSocket();
  const queryClient = useQueryClient();

  // Event callbacks
  const [apiUpdateCallbacks] = useState<Set<(update: RealtimeAPIUpdate) => void>>(new Set());
  const [notificationCallbacks] = useState<Set<(notification: RealtimeNotification) => void>>(new Set());
  const [apiChangeCallbacks] = useState<Set<(change: RealtimeAPIChange) => void>>(new Set());
  const [metricsCallbacks] = useState<Set<(metrics: RealtimeMetrics) => void>>(new Set());

  // Update stats when events are received
  const updateStats = useCallback(() => {
    setStats(prev => ({
      eventsReceived: prev.eventsReceived + 1,
      lastEventTime: new Date().toISOString(),
    }));
  }, []);

  // Handle API updates
  useWebSocketEvent('api:update', (update: RealtimeAPIUpdate) => {
    if (!isEnabled) return;
    
    updateStats();
    apiUpdateCallbacks.forEach(callback => callback(update));
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['apis'] });
    
    console.log('Real-time API update:', update);
  });

  // Handle notifications
  useWebSocketEvent('notification:new', (notification: RealtimeNotification) => {
    if (!isEnabled) return;
    
    updateStats();
    notificationCallbacks.forEach(callback => callback(notification));
    
    // Show toast notification if enabled
    if (enableToastNotifications) {
      const toastOptions = {
        duration: notification.severity === 'critical' ? 0 : 5000,
        position: 'top-right' as const,
      };

      switch (notification.severity) {
        case 'critical':
          toast.error(notification.title, toastOptions);
          break;
        case 'high':
          toast.error(notification.title, toastOptions);
          break;
        case 'medium':
          toast(notification.title, toastOptions);
          break;
        case 'low':
          toast.success(notification.title, toastOptions);
          break;
      }
    }
    
    // Invalidate notifications queries
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    
    console.log('Real-time notification:', notification);
  });

  // Handle API changes
  useWebSocketEvent('api:change', (change: RealtimeAPIChange) => {
    if (!isEnabled) return;
    
    updateStats();
    apiChangeCallbacks.forEach(callback => callback(change));
    
    // Show toast for breaking changes
    if (enableToastNotifications && change.changeType === 'breaking') {
      toast.error(`Breaking change detected in ${change.apiName}`, {
        duration: 0,
        position: 'top-right',
      });
    }
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['changelogs'] });
    queryClient.invalidateQueries({ queryKey: ['apis', change.apiId] });
    
    console.log('Real-time API change:', change);
  });

  // Handle metrics updates
  useWebSocketEvent('metrics:update', (metrics: RealtimeMetrics) => {
    if (!isEnabled) return;
    
    updateStats();
    metricsCallbacks.forEach(callback => callback(metrics));
    
    // Update specific API metrics in cache
    queryClient.setQueryData(['api', metrics.apiId, 'metrics'], (oldData: any) => ({
      ...oldData,
      ...metrics.metrics,
    }));
    
    console.log('Real-time metrics update:', metrics);
  });

  // Subscribe to specific API
  const subscribeToAPI = useCallback((apiId: string) => {
    if (!subscribedAPIs.includes(apiId)) {
      setSubscribedAPIs(prev => [...prev, apiId]);
      
      if (isConnected) {
        emit('subscribe:api', { apiId });
      }
    }
  }, [subscribedAPIs, isConnected, emit]);

  // Unsubscribe from specific API
  const unsubscribeFromAPI = useCallback((apiId: string) => {
    setSubscribedAPIs(prev => prev.filter(id => id !== apiId));
    
    if (isConnected) {
      emit('unsubscribe:api', { apiId });
    }
  }, [isConnected, emit]);

  // Event handler registration
  const onAPIUpdate = useCallback((callback: (update: RealtimeAPIUpdate) => void) => {
    apiUpdateCallbacks.add(callback);
    return () => apiUpdateCallbacks.delete(callback);
  }, [apiUpdateCallbacks]);

  const onNotification = useCallback((callback: (notification: RealtimeNotification) => void) => {
    notificationCallbacks.add(callback);
    return () => notificationCallbacks.delete(callback);
  }, [notificationCallbacks]);

  const onAPIChange = useCallback((callback: (change: RealtimeAPIChange) => void) => {
    apiChangeCallbacks.add(callback);
    return () => apiChangeCallbacks.delete(callback);
  }, [apiChangeCallbacks]);

  const onMetricsUpdate = useCallback((callback: (metrics: RealtimeMetrics) => void) => {
    metricsCallbacks.add(callback);
    return () => metricsCallbacks.delete(callback);
  }, [metricsCallbacks]);

  // Enable/disable real-time updates
  const enable = useCallback(() => {
    setIsEnabled(true);
    
    // Re-subscribe to all APIs
    if (isConnected) {
      subscribedAPIs.forEach(apiId => {
        emit('subscribe:api', { apiId });
      });
    }
  }, [isConnected, emit, subscribedAPIs]);

  const disable = useCallback(() => {
    setIsEnabled(false);
    
    // Unsubscribe from all APIs
    if (isConnected) {
      subscribedAPIs.forEach(apiId => {
        emit('unsubscribe:api', { apiId });
      });
    }
  }, [isConnected, emit, subscribedAPIs]);

  // Re-subscribe when connection is restored
  useEffect(() => {
    if (isConnected && isEnabled) {
      subscribedAPIs.forEach(apiId => {
        emit('subscribe:api', { apiId });
      });
    }
  }, [isConnected, isEnabled, subscribedAPIs, emit]);

  // Auto-subscribe to user APIs if enabled
  useEffect(() => {
    if (autoSubscribeToUserAPIs && isConnected && isEnabled) {
      // This would typically fetch user's APIs and subscribe to them
      // For now, we'll emit a general subscription request
      emit('subscribe:user_apis');
    }
  }, [autoSubscribeToUserAPIs, isConnected, isEnabled, emit]);

  const value: RealtimeContextType = {
    isEnabled,
    enable,
    disable,
    onAPIUpdate,
    onNotification,
    onAPIChange,
    onMetricsUpdate,
    subscribeToAPI,
    unsubscribeFromAPI,
    subscribedAPIs,
    stats,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

// Hook to use realtime context
export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

// Specialized hooks for specific real-time features
export const useRealtimeAPIUpdates = (callback: (update: RealtimeAPIUpdate) => void) => {
  const { onAPIUpdate } = useRealtime();
  
  useEffect(() => {
    return onAPIUpdate(callback);
  }, [onAPIUpdate, callback]);
};

export const useRealtimeNotifications = (callback: (notification: RealtimeNotification) => void) => {
  const { onNotification } = useRealtime();
  
  useEffect(() => {
    return onNotification(callback);
  }, [onNotification, callback]);
};

export const useRealtimeAPIChanges = (callback: (change: RealtimeAPIChange) => void) => {
  const { onAPIChange } = useRealtime();
  
  useEffect(() => {
    return onAPIChange(callback);
  }, [onAPIChange, callback]);
};

export const useRealtimeMetrics = (callback: (metrics: RealtimeMetrics) => void) => {
  const { onMetricsUpdate } = useRealtime();
  
  useEffect(() => {
    return onMetricsUpdate(callback);
  }, [onMetricsUpdate, callback]);
};

// Hook for API-specific subscriptions
export const useAPISubscription = (apiId: string | undefined) => {
  const { subscribeToAPI, unsubscribeFromAPI } = useRealtime();
  
  useEffect(() => {
    if (apiId) {
      subscribeToAPI(apiId);
      return () => unsubscribeFromAPI(apiId);
    }
    return undefined;
  }, [apiId, subscribeToAPI, unsubscribeFromAPI]);
};

export default RealtimeProvider;
