import { io, Socket } from 'socket.io-client';

// Socket event types
export interface SocketEvents {
  'api-change': (data: {
    apiId: string;
    apiName: string;
    changes: any[];
    severity: string;
    timestamp: string;
  }) => void;
  
  'api-health-update': (data: {
    apiId: string;
    apiName: string;
    status: string;
    previousStatus: string;
    timestamp: string;
  }) => void;
  
  'notification': (data: {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    timestamp: string;
  }) => void;
  
  'api-check-complete': (data: {
    apiId: string;
    hasChanges: boolean;
    changeCount: number;
    timestamp: string;
  }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId?: string): void {
    if (this.socket?.connected) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    this.socket = io(socketUrl, {
      auth: {
        userId
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // API Change events
    this.socket.on('api-change', (data) => {
      this.emit('api-change', data);
    });

    // API Health Update events
    this.socket.on('api-health-update', (data) => {
      this.emit('api-health-update', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    // API Check Complete events
    this.socket.on('api-check-complete', (data) => {
      this.emit('api-check-complete', data);
    });
  }

  // Subscribe to events
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Unsubscribe from events
  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    this.listeners.get(event)?.delete(callback);
  }

  // Emit events to listeners
  private emit<K extends keyof SocketEvents>(event: K, data: Parameters<SocketEvents[K]>[0]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          (callback as any)(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Join API specific room
  joinApiRoom(apiId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-api-room', apiId);
    }
  }

  // Leave API specific room
  leaveApiRoom(apiId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-api-room', apiId);
    }
  }

  // Join user notification room
  joinUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-user-room', userId);
    }
  }

  // Check connection status
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
