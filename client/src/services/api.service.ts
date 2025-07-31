import { apiClient } from '@/lib/axios';
import {
  Api,
  ApiSnapshot,
  ApiChange,
  CreateApiRequest,
  UpdateApiRequest,
  ApiResponse,
  PaginatedResponse,
  FilterState,
  SortState,
  TimeSeriesData,
} from '@/types';

class ApiService {
  private baseUrl = '/apis';

  // API Management
  async createApi(apiData: CreateApiRequest): Promise<ApiResponse<Api>> {
    const response = await apiClient.post<ApiResponse<Api>>(
      this.baseUrl,
      apiData
    );
    return response;
  }

  async getApis(
    page = 1,
    limit = 10,
    filters?: FilterState,
    sort?: SortState
  ): Promise<PaginatedResponse<Api>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.tags && filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (sort?.field) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }

    const response = await apiClient.get<PaginatedResponse<Api>>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response;
  }

  async getApiById(id: string): Promise<ApiResponse<Api>> {
    const response = await apiClient.get<ApiResponse<Api>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  async updateApi(
    id: string,
    updateData: UpdateApiRequest
  ): Promise<ApiResponse<Api>> {
    const response = await apiClient.patch<ApiResponse<Api>>(
      `${this.baseUrl}/${id}`,
      updateData
    );
    return response;
  }

  async deleteApi(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  async toggleApiStatus(id: string): Promise<ApiResponse<Api>> {
    const response = await apiClient.patch<ApiResponse<Api>>(
      `${this.baseUrl}/${id}/toggle-status`
    );
    return response;
  }

  // API Testing
  async testApi(id: string): Promise<
    ApiResponse<{
      statusCode: number;
      responseTime: number;
      size: number;
      success: boolean;
      error?: string;
    }>
  > {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/${id}/test`
    );
    return response;
  }

  async testApiEndpoint(
    url: string,
    config?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    }
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/test-endpoint`,
      { url, ...config }
    );
    return response;
  }

  // API Snapshots
  async getApiSnapshots(
    apiId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<ApiSnapshot>> {
    const response = await apiClient.get<PaginatedResponse<ApiSnapshot>>(
      `${this.baseUrl}/${apiId}/snapshots?page=${page}&limit=${limit}`
    );
    return response;
  }

  async getSnapshotById(
    apiId: string,
    snapshotId: string
  ): Promise<ApiResponse<ApiSnapshot>> {
    const response = await apiClient.get<ApiResponse<ApiSnapshot>>(
      `${this.baseUrl}/${apiId}/snapshots/${snapshotId}`
    );
    return response;
  }

  async createSnapshot(apiId: string): Promise<ApiResponse<ApiSnapshot>> {
    const response = await apiClient.post<ApiResponse<ApiSnapshot>>(
      `${this.baseUrl}/${apiId}/snapshots`
    );
    return response;
  }

  async compareSnapshots(
    apiId: string,
    fromSnapshotId: string,
    toSnapshotId: string
  ): Promise<
    ApiResponse<{
      changes: ApiChange[];
      summary: {
        added: number;
        modified: number;
        removed: number;
      };
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${apiId}/snapshots/compare?from=${fromSnapshotId}&to=${toSnapshotId}`
    );
    return response;
  }

  // API Changes
  async getApiChanges(
    apiId: string,
    page = 1,
    limit = 10,
    severity?: string,
    changeType?: string
  ): Promise<PaginatedResponse<ApiChange>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (severity) params.append('severity', severity);
    if (changeType) params.append('changeType', changeType);

    const response = await apiClient.get<PaginatedResponse<ApiChange>>(
      `${this.baseUrl}/${apiId}/changes?${params.toString()}`
    );
    return response;
  }

  async getChangeById(
    apiId: string,
    changeId: string
  ): Promise<ApiResponse<ApiChange>> {
    const response = await apiClient.get<ApiResponse<ApiChange>>(
      `${this.baseUrl}/${apiId}/changes/${changeId}`
    );
    return response;
  }

  // API Analytics
  async getApiAnalytics(
    apiId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<ApiResponse<TimeSeriesData>> {
    const response = await apiClient.get<ApiResponse<TimeSeriesData>>(
      `${this.baseUrl}/${apiId}/analytics?timeRange=${timeRange}`
    );
    return response;
  }

  async getApiUptime(
    apiId: string,
    days = 30
  ): Promise<
    ApiResponse<{
      uptime: number;
      downtime: number;
      totalChecks: number;
      successfulChecks: number;
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${apiId}/uptime?days=${days}`
    );
    return response;
  }

  async getApiPerformance(
    apiId: string,
    days = 7
  ): Promise<
    ApiResponse<{
      averageResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      totalRequests: number;
    }>
  > {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${apiId}/performance?days=${days}`
    );
    return response;
  }

  // Bulk Operations
  async bulkUpdateApis(
    apiIds: string[],
    updateData: Partial<UpdateApiRequest>
  ): Promise<ApiResponse<{ updated: number; failed: number }>> {
    const response = await apiClient.patch<ApiResponse<any>>(
      `${this.baseUrl}/bulk-update`,
      { apiIds, updateData }
    );
    return response;
  }

  async bulkDeleteApis(
    apiIds: string[]
  ): Promise<ApiResponse<{ deleted: number; failed: number }>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/bulk-delete`,
      { apiIds }
    );
    return response;
  }

  // Export/Import
  async exportApis(apiIds?: string[]): Promise<Blob> {
    const response = await apiClient.post(
      `${this.baseUrl}/export`,
      { apiIds },
      { responseType: 'blob' }
    );
    return response;
  }

  async importApis(
    file: File
  ): Promise<ApiResponse<{ imported: number; failed: number }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }

  // Tags Management
  async getAllTags(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `${this.baseUrl}/tags`
    );
    return response;
  }

  async getPopularTags(
    limit = 10
  ): Promise<ApiResponse<Array<{ tag: string; count: number }>>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/tags/popular?limit=${limit}`
    );
    return response;
  }
}

export const apiService = new ApiService();
export default apiService;
