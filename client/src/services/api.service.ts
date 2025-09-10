/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/lib/axios';
import {
  Api,
  CreateApiRequest,
  UpdateApiRequest,
  ApiResponse,
  PaginatedResponse,
  CheckNowResponse,
} from '@/types';

class ApiService {
  private baseUrl = '/apis';

  async getApis(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    status?: 'all' | 'active' | 'inactive';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Api[]> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tags?.length) queryParams.append('tags', params.tags.join(','));
    if (params?.status && params.status !== 'all')
      queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return await apiClient.get<Api[]>(
      `${this.baseUrl}?${queryParams.toString()}`
    );
  }

  async getApiById(id: string): Promise<Api> {
    return await apiClient.get<Api>(`${this.baseUrl}/${id}`);
  }

  async createApi(apiData: CreateApiRequest): Promise<ApiResponse<Api>> {
    const response = await apiClient.post<ApiResponse<Api>>(
      this.baseUrl,
      apiData
    );
    return response;
  }

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

  async deleteApi(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  async toggleApiStatus(id: string): Promise<ApiResponse<Api>> {
    const response = await apiClient.put<ApiResponse<Api>>(
      `${this.baseUrl}/${id}/toggle`
    );
    return response;
  }

  async checkApi(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/${id}/check-now`
    );
    return response;
  }

  async getApiHealth(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${id}/health`
    );
    return response;
  }

  async getApiStats(id: string, timeRange?: string): Promise<ApiResponse<any>> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${id}/stats${params}`
    );
    return response;
  }

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

  async testApi(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/${id}/test`
    );
    return response;
  }

  async getTags(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `${this.baseUrl}/tags`
    );
    return response;
  }

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

  async getApiDocumentation(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/${id}/documentation`
    );
    return response;
  }

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

  async testConnection(id: string): Promise<{
    status: 'healthy' | 'unhealthy' | 'error';
    responseTime: number;
    statusCode: number;
    error?: string;
    timestamp: string;
  }> {
    return await apiClient.post(`${this.baseUrl}/${id}/test`);
  }

  async checkNow(id: string): Promise<CheckNowResponse> {
    return await apiClient.post(`${this.baseUrl}/${id}/check-now`);
  }

  async checkAllApis(): Promise<{
    message: string;
    checked: number;
  }> {
    return await apiClient.post(`${this.baseUrl}/check-all`);
  }

  async getApisByTag(tag: string): Promise<ApiResponse<Api>[]> {
    return await apiClient.get(`${this.baseUrl}?tag=${tag}`);
  }

  async getGeneralStats(): Promise<{
    totalApis: number;
    activeMonitoring: number;
    totalChangesToday: number;
    healthyApis: number;
    criticalIssues: number;
    avgResponseTime: number;
    uptime: number;
  }> {
    return await apiClient.get(`${this.baseUrl}/stats`);
  }

  async bulkToggleStatus(ids: string[]): Promise<{
    updated: number;
    errors: string[];
  }> {
    return await apiClient.post(`${this.baseUrl}/bulk/toggle-status`, { ids });
  }

  async bulkDelete(ids: string[]): Promise<{
    deleted: number;
    errors: string[];
  }> {
    return await apiClient.post(`${this.baseUrl}/bulk/delete`, { ids });
  }

  async bulkUpdateTags(
    ids: string[],
    tags: string[]
  ): Promise<{
    updated: number;
    errors: string[];
  }> {
    return await apiClient.post(`${this.baseUrl}/bulk/update-tags`, {
      ids,
      tags,
    });
  }

  async searchApis(
    query: string,
    filters?: {
      tags?: string[];
      status?: string;
      healthStatus?: string;
      lastChecked?: string;
    }
  ): Promise<PaginatedResponse<Api>> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.tags?.length) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.healthStatus) {
      params.append('healthStatus', filters.healthStatus);
    }
    if (filters?.lastChecked) {
      params.append('lastChecked', filters.lastChecked);
    }

    return await apiClient.get(`${this.baseUrl}/search?${params.toString()}`);
  }

  async validateApiUrl(url: string): Promise<{
    valid: boolean;
    accessible: boolean;
    responseTime: number;
    statusCode: number;
    hasSwagger: boolean;
    swaggerUrl?: string;
    apiInfo?: {
      title?: string;
      version?: string;
      description?: string;
    };
    error?: string;
  }> {
    return await apiClient.post(`${this.baseUrl}/validate-url`, { url });
  }

  async getApiHealthIssues(id: string): Promise<{
    apiId: string;
    apiName: string;
    healthStatus: string;
    issueCount: number;
    issues: Array<{
      type: string;
      severity: string;
      title: string;
      description: string;
      suggestion?: string;
      affectedEndpoints?: string[];
      relatedChanges?: Array<{
        date: string;
        changeType: string;
        description: string;
      }>;
    }>;
    lastChecked: string;
  }> {
    return await apiClient.get(`${this.baseUrl}/${id}/health-issues`);
  }
}

export const apiService = new ApiService();
