import { apiClient } from '@/lib/axios';
import {
  Api,
  CreateApiRequest,
  UpdateApiRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

class ApiService {
  private baseUrl = '/apis';

  // Get all APIs for the authenticated user
  async getApis(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    status?: 'all' | 'active' | 'inactive';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Api>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tags?.length) queryParams.append('tags', params.tags.join(','));
    if (params?.status && params.status !== 'all')
      queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<PaginatedResponse<Api>>(
      `${this.baseUrl}?${queryParams.toString()}`
    );
    return response;
  }

  // Get a single API by ID
  async getApiById(id: string): Promise<ApiResponse<Api>> {
    const response = await apiClient.get<ApiResponse<Api>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  // Create a new API
  async createApi(apiData: CreateApiRequest): Promise<ApiResponse<Api>> {
    const response = await apiClient.post<ApiResponse<Api>>(
      this.baseUrl,
      apiData
    );
    return response;
  }

  // Update an existing API
  async updateApi(
    id: string,
    apiData: UpdateApiRequest
  ): Promise<ApiResponse<Api>> {
    const response = await apiClient.put<ApiResponse<Api>>(
      `${this.baseUrl}/${id}`,
      apiData
    );
    return response;
  }

  // Delete an API
  async deleteApi(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  // Toggle API active status
  async toggleApiStatus(id: string): Promise<ApiResponse<Api>> {
    const response = await apiClient.patch<ApiResponse<Api>>(
      `${this.baseUrl}/${id}/toggle-status`
    );
    return response;
  }

  // Manually trigger API check
  async checkApi(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/${id}/check`
    );
    return response;
  }

  // Get API health status
  async getApiHealth(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${id}/health`
    );
    return response;
  }

  // Get API statistics
  async getApiStats(id: string, timeRange?: string): Promise<ApiResponse<any>> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${id}/stats${params}`
    );
    return response;
  }

  // Get API changes/changelog
  async getApiChanges(
    id: string,
    params?: {
      page?: number;
      limit?: number;
      severity?: string;
      changeType?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.changeType) queryParams.append('changeType', params.changeType);

    const response = await apiClient.get<PaginatedResponse<any>>(
      `${this.baseUrl}/${id}/changes?${queryParams.toString()}`
    );
    return response;
  }

  // Export API data
  async exportApi(
    id: string,
    format: 'json' | 'csv' | 'yaml' = 'json'
  ): Promise<Blob> {
    const response = await apiClient.get(
      `${this.baseUrl}/${id}/export?format=${format}`,
      {
        responseType: 'blob',
      }
    );
    return response;
  }

  // Test API endpoint
  async testApi(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/${id}/test`
    );
    return response;
  }

  // Get dashboard stats
  async getDashboardStats(): Promise<
    ApiResponse<{
      totalApis: number;
      activeApis: number;
      totalChanges: number;
      criticalIssues: number;
      healthyApis: number;
      unhealthyApis: number;
      recentChanges: any[];
      apisByTag: Record<string, number>;
      changesTrend: any[];
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/dashboard/stats`
    );
    return response;
  }

  // Get all tags
  async getTags(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `${this.baseUrl}/tags`
    );
    return response;
  }

  // Get API snapshot history
  async getApiSnapshots(
    id: string,
    params?: {
      page?: number;
      limit?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);

    const response = await apiClient.get<PaginatedResponse<any>>(
      `${this.baseUrl}/${id}/snapshots?${queryParams.toString()}`
    );
    return response;
  }

  // Compare API versions
  async compareApiVersions(
    id: string,
    fromVersion: string,
    toVersion: string
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${id}/compare?from=${fromVersion}&to=${toVersion}`
    );
    return response;
  }

  // Get API documentation
  async getApiDocumentation(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${id}/documentation`
    );
    return response;
  }

  // Update check frequency
  async updateCheckFrequency(
    id: string,
    frequency: string
  ): Promise<ApiResponse<Api>> {
    const response = await apiClient.patch<ApiResponse<Api>>(
      `${this.baseUrl}/${id}/check-frequency`,
      { checkFrequency: frequency }
    );
    return response;
  }
}

export const apiService = new ApiService();
