import { apiClient } from '@/lib/axios';
import { Changelog, ApiResponse, PaginatedResponse } from '@/types';

class ChangelogService {
  private baseUrl = '/changelogs';

  // Get all changelogs for an API
  async getApiChangelogs(
    apiId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Changelog>> {
    const response = await apiClient.get<PaginatedResponse<Changelog>>(
      `${this.baseUrl}/${apiId}?page=${page}&limit=${limit}`
    );
    return response;
  }

  // Get a specific changelog
  async getChangelog(
    apiId: string,
    changelogId: string
  ): Promise<ApiResponse<Changelog>> {
    const response = await apiClient.get<ApiResponse<Changelog>>(
      `${this.baseUrl}/${apiId}/${changelogId}`
    );
    return response;
  }

  // Create a new changelog entry
  async createChangelog(
    apiId: string,
    changelogData: {
      title: string;
      description: string;
      version: string;
      changes: string[];
    }
  ): Promise<ApiResponse<Changelog>> {
    const response = await apiClient.post<ApiResponse<Changelog>>(
      `${this.baseUrl}/${apiId}`,
      changelogData
    );
    return response;
  }

  // Update changelog
  async updateChangelog(
    apiId: string,
    changelogId: string,
    updateData: Partial<{
      title: string;
      description: string;
      version: string;
      changes: string[];
    }>
  ): Promise<ApiResponse<Changelog>> {
    const response = await apiClient.patch<ApiResponse<Changelog>>(
      `${this.baseUrl}/${apiId}/${changelogId}`,
      updateData
    );
    return response;
  }

  // Delete changelog
  async deleteChangelog(
    apiId: string,
    changelogId: string
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `${this.baseUrl}/${apiId}/${changelogId}`
    );
    return response;
  }

  // Get all changelogs for user (across all APIs)
  async getUserChangelogs(
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Changelog & { apiName: string }>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `${this.baseUrl}?page=${page}&limit=${limit}`
    );
    return response;
  }

  // Export changelogs
  async exportChangelogs(apiId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${apiId}/export`, {
      responseType: 'blob',
    });
    return response;
  }
}

export const changelogService = new ChangelogService();
export default changelogService;
