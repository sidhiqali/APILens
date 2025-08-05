'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/store/auth';
import { toast } from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  reconnect: () => void;
  connectionAttempts: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  autoConnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const { user } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socket?.connected || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const newSocket = io(url, {
        auth: {
          token: user?.api_key,
          userId: user?._id,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: false, // We'll handle reconnection manually
      });

      // Connection successful
      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        setConnectionAttempts(0);
        
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Re-subscribe to all events
        subscribersRef.current.forEach((callbacks, event) => {
          callbacks.forEach(callback => {
            newSocket.on(event, callback);
          });
        });

        toast.success('Connected to real-time updates', {
          duration: 2000,
          position: 'bottom-right',
        });
      });

      // Connection error
      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(error.message || 'Connection failed');
        
        // Attempt reconnection if under max attempts
        if (connectionAttempts < maxReconnectAttempts) {
          scheduleReconnect();
        } else {
          toast.error('Failed to connect to real-time updates', {
            duration: 5000,
            position: 'bottom-right',
          });
        }
      });

      // Disconnection
      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          setConnectionError('Server disconnected');
        } else {
          // Client-side disconnect or network issue, attempt reconnect
          scheduleReconnect();
        }
      });

      // Authentication error
      newSocket.on('auth_error', (error) => {
        console.error('WebSocket auth error:', error);
        setConnectionError('Authentication failed');
        setIsConnected(false);
        setIsConnecting(false);
        
        toast.error('Authentication failed for real-time updates', {
          duration: 5000,
          position: 'bottom-right',
        });
      });

      // Rate limit error
      newSocket.on('rate_limit', (data) => {
        console.warn('WebSocket rate limit:', data);
        toast.error('Too many requests. Please slow down.', {
          duration: 3000,
          position: 'bottom-right',
        });
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
      setConnectionError('Failed to initialize connection');
    }
  }, [url, user?.api_key, user?._id, connectionAttempts, maxReconnectAttempts]);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    setConnectionAttempts(prev => prev + 1);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect... (${connectionAttempts + 1}/${maxReconnectAttempts})`);
      connect();
    }, reconnectInterval);
  }, [connect, connectionAttempts, maxReconnectAttempts, reconnectInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    setConnectionAttempts(0);
  }, [socket]);

  // Reconnect (manual)
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [disconnect, connect]);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  }, [socket]);

  // Subscribe to event
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    // Add to subscribers map
    if (!subscribersRef.current.has(event)) {
      subscribersRef.current.set(event, new Set());
    }
    subscribersRef.current.get(event)!.add(callback);

    // Subscribe to socket if connected
    if (socket?.connected) {
      socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(event);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersRef.current.delete(event);
        }
      }
      
      if (socket?.connected) {
        socket.off(event, callback);
      }
    };
  }, [socket]);

  // Auto-connect on mount and user change
  useEffect(() => {
    if (autoConnect && user && user.api_key) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, user, user?.api_key, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    emit,
    subscribe,
    reconnect,
    connectionAttempts,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Connection status indicator component
interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = '',
  showText = true,
}) => {
  const { isConnected, isConnecting, connectionError } = useWebSocket();

  const getStatusColor = () => {
    if (connectionError) return 'bg-red-500';
    if (isConnecting) return 'bg-yellow-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (connectionError) return 'Disconnected';
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Offline';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`} />
      {showText && (
        <span className="text-sm text-gray-600">{getStatusText()}</span>
      )}
    </div>
  );
};

// Hook for specific event subscriptions
export const useWebSocketEvent = (event: string, callback: (data: any) => void, deps: any[] = []) => {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(event, callback);
    return unsubscribe;
  }, [event, subscribe, ...deps]);
};

// Hook for emitting events
export const useWebSocketEmit = () => {
  const { emit } = useWebSocket();
  return emit;
};

export default WebSocketProvider;
