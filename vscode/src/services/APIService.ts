import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as vscode from 'vscode';

export interface AuthResponse {
    user: any;
    message: string;
}

export interface ApiData {
    id: string;
    apiName: string;
    description?: string;
    type: string;
    version?: string;
    isActive: boolean;
    healthStatus: 'healthy' | 'unhealthy' | 'checking' | 'unknown';
    lastChecked?: string;
    changeCount?: number;
}

export interface DashboardStats {
    totalApis: number;
    activeApis: number;
    totalChanges: number;
    criticalIssues: number;
    healthyApis: number;
    unhealthyApis: number;
    totalNotifications: number;
    unreadNotifications: number;
}

export class APIService {
    private api: AxiosInstance;
    private context: vscode.ExtensionContext | null = null;

    constructor() {
        const config = vscode.workspace.getConfiguration('apilens');
        const baseURL = config.get<string>('apiUrl', 'http://localhost:3000');

        this.api = axios.create({
            baseURL,
            timeout: 10000,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    setContext(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private setupInterceptors() {
        this.api.interceptors.request.use(
            async (config) => {
                // Don't add Authorization header - use session cookies instead
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.api.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    await this.clearAuth();
                    vscode.window.showErrorMessage('Session expired. Please login again.');
                }
                throw error;
            }
        );
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            const response = await this.api.post('/auth/login', { email, password });
            // Session-based auth - store user data but no token needed
            await this.storeAuth({
                user: response.data.user,
                message: response.data.message
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async logout(): Promise<void> {
        try {
            await this.api.post('/auth/logout');
        } catch (error) {
        } finally {
            await this.clearAuth();
        }
    }

    async getProfile(): Promise<any> {
        try {
            const response = await this.api.get('/auth/profile');
            return response.data.user || response.data.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async validateSession(): Promise<boolean> {
        try {
            const response = await this.api.get('/auth/profile');
            return !!(response.data && response.data.user);
        } catch {
            return false;
        }
    }

    async getDashboardStats(): Promise<DashboardStats> {
        try {
            const response = await this.api.get('/dashboard/stats');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getDashboardOverview(): Promise<any> {
        try {
            const response = await this.api.get('/dashboard/overview');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getRecentActivity(limit?: number): Promise<any[]> {
        try {
            const response = await this.api.get('/dashboard/recent-activity', { 
                params: { limit } 
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getApis(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<ApiData[]> {
        try {
            const response = await this.api.get('/apis', { params });
            return response.data.data || response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getApi(id: string): Promise<ApiData> {
        try {
            const response = await this.api.get(`/apis/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createApi(apiData: any): Promise<ApiData> {
        try {
            const response = await this.api.post('/apis', apiData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async testOpenApiUrl(url: string): Promise<{ valid: boolean; spec?: any; error?: string }> {
        try {
            const response = await this.api.post('/apis/test-openapi-url', { url });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateApi(id: string, apiData: any): Promise<ApiData> {
        try {
            const response = await this.api.put(`/apis/${id}`, apiData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteApi(id: string): Promise<void> {
        try {
            await this.api.delete(`/apis/${id}`);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async toggleApiStatus(id: string): Promise<void> {
        try {
            await this.api.patch(`/apis/${id}/toggle-status`);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async checkApiNow(id: string): Promise<void> {
        try {
            await this.api.post(`/apis/${id}/check`);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAnalytics(params?: {
        startDate?: string;
        endDate?: string;
        apiId?: string;
    }): Promise<any> {
        try {
            const response = await this.api.get('/dashboard/overview', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getChangelogs(params?: {
        page?: number;
        limit?: number;
        apiId?: string;
        severity?: string;
    }): Promise<any[]> {
        try {
            const response = await this.api.get('/changelogs', { params });
            return response.data.data || response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getChangelog(id: string): Promise<any> {
        try {
            const response = await this.api.get(`/changelogs/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getNotifications(params?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<any[]> {
        try {
            const response = await this.api.get('/notifications', { 
                params: {
                    limit: params?.limit,
                    offset: params?.page ? (params.page - 1) * (params.limit || 20) : undefined,
                    unreadOnly: params?.unreadOnly
                }
            });
            return response.data.notifications || response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async markNotificationAsRead(id: string): Promise<void> {
        try {
            await this.api.put(`/notifications/${id}/read`);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async markAllNotificationsAsRead(): Promise<void> {
        try {
            await this.api.put('/notifications/mark-all-read');
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getUserSettings(): Promise<any> {
        try {
            const response = await this.api.get('/auth/profile');
            return response.data.user;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateUserSettings(settings: any): Promise<any> {
        try {
            const response = await this.api.put('/auth/notification-preferences', settings);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private async storeAuth(authData: any): Promise<void> {
        if (this.context) {
            await this.context.globalState.update('apilens.user', authData.user);
            await this.context.globalState.update('apilens.isAuthenticated', true);
            // Don't store token for session-based auth
        }
    }

    private async clearAuth(): Promise<void> {
        if (this.context) {
            await this.context.globalState.update('apilens.user', undefined);
            await this.context.globalState.update('apilens.isAuthenticated', false);
            // Don't need to clear token for session-based auth
        }
    }

    async getStoredUser(): Promise<any> {
        if (this.context) {
            return this.context.globalState.get('apilens.user');
        }
        return null;
    }

    async getStoredToken(): Promise<string | undefined> {
        // Session-based auth - no token needed
        return undefined;
    }

    async isAuthenticated(): Promise<boolean> {
        if (this.context) {
            const stored = this.context.globalState.get('apilens.isAuthenticated', false);
            if (stored) {
                return await this.validateSession();
            }
        }
        return false;
    }

    private handleError(error: any): Error {
        if (error.response) {
            const message = error.response.data?.message || 'API request failed';
            return new Error(message);
        } else if (error.request) {
            return new Error('Network error. Please check your connection.');
        } else {
            return new Error('An unexpected error occurred');
        }
    }
}
