import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import { APIService } from './APIService';

export interface WebSocketEventData {
    apiId: string;
    apiName: string;
    status?: string;
    changeType?: string;
    timestamp: string;
}

export class WebSocketService {
    private socket: Socket | null = null;
    private context: vscode.ExtensionContext;
    private apiService: APIService;
    private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

    constructor(context: vscode.ExtensionContext, apiService: APIService) {
        this.context = context;
        this.apiService = apiService;
    }

    async connect(): Promise<void> {
        const config = vscode.workspace.getConfiguration('apilens');
        const enableRealtime = config.get('enableRealtime', true);
        
        if (!enableRealtime) {
            console.log('Real-time features disabled by configuration');
            return;
        }

        const apiUrl = config.get('apiUrl', 'http://localhost:3000');
        
        try {
            // Get auth token for WebSocket connection
            const token = await this.apiService.getStoredToken();
            if (!token) {
                console.log('No auth token available for WebSocket connection');
                return;
            }

            this.socket = io(apiUrl, {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('Connected to APILens WebSocket server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from APILens WebSocket server');
            });

            this.socket.on('api-change', (data: WebSocketEventData) => {
                this.emit('api-change', data);
            });

            this.socket.on('api-health-change', (data: WebSocketEventData) => {
                this.emit('api-health-change', data);
            });

            this.socket.on('api-created', (data: WebSocketEventData) => {
                this.emit('api-created', data);
            });

            this.socket.on('api-deleted', (data: WebSocketEventData) => {
                this.emit('api-deleted', data);
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
            });

        } catch (error) {
            console.error('Failed to connect to WebSocket server:', error);
        }
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.eventListeners.clear();
    }

    on(event: string, callback: (data: any) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    off(event: string, callback?: (data: any) => void): void {
        if (!this.eventListeners.has(event)) {
            return;
        }

        if (callback) {
            const listeners = this.eventListeners.get(event)!;
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        } else {
            this.eventListeners.delete(event);
        }
    }

    private emit(event: string, data: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in WebSocket event listener for ${event}:`, error);
                }
            });
        }
    }

    isConnected(): boolean {
        return this.socket ? this.socket.connected : false;
    }

    getConnectionStatus(): string {
        if (!this.socket) {
            return 'disconnected';
        }
        return this.socket.connected ? 'connected' : 'connecting';
    }
}
