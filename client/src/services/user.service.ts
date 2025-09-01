import { apiClient } from '@/lib/axios';
import { User, ApiResponse, PaginatedResponse } from '@/types';

class UserService {
  private baseUrl = '/users';

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(
      `${this.baseUrl}/profile`
    );
    return response;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `${this.baseUrl}/profile`,
      userData
    );
    return response;
  }

  async uploadProfilePicture(
    file: File
  ): Promise<ApiResponse<{ profilePicture: string }>> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/profile-picture`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }

  async deleteProfilePicture(): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/profile-picture`
    );
    return response;
  }

  async getUserStats(): Promise<
    ApiResponse<{
      totalApis: number;
      activeApis: number;
      totalChanges: number;
      recentChanges: number;
      uptime: number;
      averageResponseTime: number;
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/stats`
    );
    return response;
  }

  async getUserActivity(
    page = 1,
    limit = 10,
    type?: 'api_created' | 'api_updated' | 'api_deleted' | 'change_detected'
  ): Promise<
    PaginatedResponse<{
      id: string;
      type: string;
      description: string;
      metadata: Record<string, any>;
      createdAt: string;
    }>
  > {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    const response = await apiClient.get<PaginatedResponse<any>>(
      `${this.baseUrl}/activity?${params.toString()}`
    );
    return response;
  }

  async getUserPreferences(): Promise<
    ApiResponse<{
      theme: 'light' | 'dark' | 'system';
      language: string;
      timezone: string;
      dateFormat: string;
      notifications: {
        email: boolean;
        push: boolean;
        desktop: boolean;
      };
      dashboard: {
        defaultView: 'grid' | 'list';
        itemsPerPage: number;
        autoRefresh: boolean;
        refreshInterval: number;
      };
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/preferences`
    );
    return response;
  }

  async updateUserPreferences(
    preferences: Partial<{
      theme: 'light' | 'dark' | 'system';
      language: string;
      timezone: string;
      dateFormat: string;
      notifications: {
        email: boolean;
        push: boolean;
        desktop: boolean;
      };
      dashboard: {
        defaultView: 'grid' | 'list';
        itemsPerPage: number;
        autoRefresh: boolean;
        refreshInterval: number;
      };
    }>
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.patch<ApiResponse<any>>(
      `${this.baseUrl}/preferences`,
      preferences
    );
    return response;
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/account`
    );
    return response;
  }

  async exportUserData(): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      responseType: 'blob',
    });
    return response;
  }

  async getAllUsers(
    page = 1,
    limit = 10,
    search?: string,
    role?: string
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (role) params.append('role', role);

    const response = await apiClient.get<PaginatedResponse<User>>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `${this.baseUrl}/${id}`,
      userData
    );
    return response;
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }
}

export const userService = new UserService();
export default userService;
