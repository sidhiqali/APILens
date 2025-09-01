import { apiClient } from '@/lib/axios';

export interface ApiChange {
  _id: string;
  apiId: string;
  fromVersion?: string;
  toVersion?: string;
  changeType: 'breaking' | 'non-breaking' | 'deprecation' | 'addition';
  severity: 'low' | 'medium' | 'high' | 'critical';
  changes: ChangeDetail[];
  detectedAt: string;
  summary: string;
  impactScore: number;
}

export interface ChangeDetail {
  path: string;
  operation: 'added' | 'removed' | 'modified';
  changeType: 'endpoint' | 'parameter' | 'schema' | 'response' | 'header';
  oldValue?: any;
  newValue?: any;
  description: string;
  breaking: boolean;
}

export interface ApiSnapshot {
  _id: string;
  apiId: string;
  version: string;
  detectedAt: string;
  metadata: {
    endpointCount: number;
    schemaCount: number;
    specSize: number;
  };
  schema: any;
}

export interface Changelog {
  _id: string;
  apiId: string;
  title: string;
  description: string;
  version: string;
  changeDate: string;
  changes: string[];
  createdAt: string;
  previousVersion?: string;
  newVersion?: string;
  diffSummary?: string;
  timestamp: string;
}

export interface PaginatedChanges {
  changes: ApiChange[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedSnapshots {
  snapshots: ApiSnapshot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ChangelogService {
  private baseUrl = '/apis';

  async getAllChanges(
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      severity?: string;
      type?: string;
      days?: number;
    }
  ): Promise<PaginatedChanges> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.days) queryParams.append('days', params.days.toString());

    return await apiClient.get<PaginatedChanges>(
      `/changelogs?${queryParams.toString()}`
    );
  }

  async getApiChanges(
    apiId: string,
    params?: {
      page?: number;
      limit?: number;
      severity?: string;
      changeType?: string;
    }
  ): Promise<ApiChange[]> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.changeType) queryParams.append('changeType', params.changeType);

    return await apiClient.get<ApiChange[]>(
      `${this.baseUrl}/${apiId}/changes?${queryParams.toString()}`
    );
  }

  async getApiSnapshots(
    apiId: string,
    limit: number = 10
  ): Promise<ApiSnapshot[]> {
    return await apiClient.get<ApiSnapshot[]>(
      `${this.baseUrl}/${apiId}/snapshots?limit=${limit}`
    );
  }

  async getApiChangelogs(
    apiId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Changelog[]> {
    return await apiClient.get<Changelog[]>(
      `${this.baseUrl}/${apiId}/changelog?page=${page}&limit=${limit}`
    );
  }

  async getChangelog(apiId: string, changelogId: string): Promise<Changelog> {
    return await apiClient.get<Changelog>(
      `${this.baseUrl}/${apiId}/changelog/${changelogId}`
    );
  }

  async createChangelog(
    apiId: string,
    changelogData: {
      title: string;
      description: string;
      version: string;
      changes: string[];
    }
  ): Promise<Changelog> {
    return await apiClient.post<Changelog>(
      `${this.baseUrl}/${apiId}/changelog`,
      changelogData
    );
  }

  async updateChangelog(
    apiId: string,
    changelogId: string,
    changelogData: {
      title?: string;
      description?: string;
      version?: string;
      changes?: string[];
    }
  ): Promise<Changelog> {
    return await apiClient.put<Changelog>(
      `${this.baseUrl}/${apiId}/changelog/${changelogId}`,
      changelogData
    );
  }

  async deleteChangelog(apiId: string, changelogId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${apiId}/changelog/${changelogId}`);
  }

  async compareVersions(
    apiId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<{
    changes: ChangeDetail[];
    summary: string;
    breakingChanges: number;
    totalChanges: number;
  }> {
    return await apiClient.get(
      `${this.baseUrl}/${apiId}/compare?from=${fromVersion}&to=${toVersion}`
    );
  }

  async getChangeStats(
    apiId: string,
    timeRange: string = '30d'
  ): Promise<{
    totalChanges: number;
    breakingChanges: number;
    nonBreakingChanges: number;
    changesByType: Record<string, number>;
    changesBySeverity: Record<string, number>;
    changesTrend: { date: string; count: number }[];
  }> {
    return await apiClient.get(
      `${this.baseUrl}/${apiId}/stats?timeRange=${timeRange}`
    );
  }

  async exportChangelogs(apiId: string): Promise<Blob> {
    return await apiClient.get(`${this.baseUrl}/${apiId}/export`, {
      responseType: 'blob',
    });
  }
}

export const changelogService = new ChangelogService();
