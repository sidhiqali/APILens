// src/modules/apis/apis.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosResponse } from 'axios';
import { CreateApiDto } from './dto/create-api.dto';
import { ApiResponseDto } from './dto/api-response.dto';
import { Api } from 'src/Schemas/api.schema';
import { OpenAPISpec } from 'src/types/api.type';
import { UpdateApiDto } from './dto/update-api.dto';
import { ApiHealthDto, ApiStatsDto } from './dto/api.dto';
import { diffOpenApi } from 'utils/api-diff';
import { Changelog } from 'src/Schemas/changelog-schema';

@Injectable()
export class ApisService {
  constructor(
    @InjectModel(Api.name) private apiModel: Model<Api>,
    @InjectModel(Changelog.name) private changelogModel: Model<Changelog>,
  ) {}

  async registerApi(
    dto: CreateApiDto,
    userId: string,
  ): Promise<ApiResponseDto> {
    try {
      // Test API connection and fetch spec
      const response: AxiosResponse<OpenAPISpec> = await axios.get(
        dto.openApiUrl,
        {
          timeout: 10000,
          headers: { 'User-Agent': 'API-Lens/1.0' },
        },
      );

      const { info } = response.data;
      if (!info?.version) {
        throw new Error('Invalid OpenAPI spec - missing version information');
      }

      const api = new this.apiModel({
        apiName: dto.apiName,
        openApiUrl: dto.openApiUrl,
        type: dto.type || 'openapi',
        version: info.version,
        latestSpec: response.data,
        lastChecked: new Date(),
        userId,
        checkFrequency: dto.checkFrequency || '1h',
        tags: dto.tags || [],
        description: dto.description,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        changeCount: 0,
        isActive: true,
      });

      const savedApi = await api.save();
      return this.toResponseDto(savedApi);
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNrefused') {
        throw new Error(
          'Cannot connect to API URL. Please check the URL and try again.',
        );
      }
      if (error.response?.status >= 400) {
        throw new Error(
          `API returned ${error.response.status}: ${error.response.statusText}`,
        );
      }
      throw new Error(`Failed to register API: ${error.message}`);
    }
  }

  async getAllApis(userId?: string): Promise<ApiResponseDto[]> {
    const apis = await this.apiModel.find({ userId }).sort({ createdAt: -1 });

    return apis.map((api) => this.toResponseDto(api));
  }

  async getApiById(id: string, userId: string): Promise<ApiResponseDto> {
    const api = await this.apiModel.findById(id);
    if (!api) {
      throw new NotFoundException('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.toResponseDto(api);
  }

  async updateApi(
    id: string,
    dto: UpdateApiDto,
    userId: string,
  ): Promise<ApiResponseDto> {
    const api = await this.apiModel.findById(id);
    if (!api) {
      throw new NotFoundException('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(api, dto);
    const updatedApi = await api.save();
    return this.toResponseDto(updatedApi);
  }

  async deleteApi(id: string, userId: string): Promise<void> {
    const api = await this.apiModel.findById(id);
    if (!api) {
      throw new NotFoundException('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.apiModel.findByIdAndDelete(id);
  }

  async testApiConnection(id: string, userId: string): Promise<ApiHealthDto> {
    const api = await this.getApiById(id, userId);

    try {
      const startTime = Date.now();
      await axios.get(api.openApiUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'API-Lens/1.0' },
      });
      const responseTime = Date.now() - startTime;

      // Update health status
      await this.apiModel.findByIdAndUpdate(id, {
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        lastError: null,
      });

      return {
        id: api.id,
        apiName: api.apiName,
        status: 'healthy',
        responseTime,
        lastChecked: new Date(),
        uptime: 100, // Calculate actual uptime later
      };
    } catch (error) {
      const errorMessage = error.message || 'Connection failed';

      // Update health status
      await this.apiModel.findByIdAndUpdate(id, {
        healthStatus: 'unhealthy',
        lastHealthCheck: new Date(),
        lastError: errorMessage,
      });

      return {
        id: api.id,
        apiName: api.apiName,
        status: 'unhealthy',
        lastChecked: new Date(),
        error: errorMessage,
      };
    }
  }

  async toggleApiStatus(id: string, userId: string): Promise<ApiResponseDto> {
    const api = await this.apiModel.findById(id);
    if (!api) {
      throw new NotFoundException('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    api.isActive = !api.isActive;
    const updatedApi = await api.save();
    return this.toResponseDto(updatedApi);
  }

  async getApiStats(userId: string): Promise<ApiStatsDto> {
    const totalApis = await this.apiModel.countDocuments({ userId });
    const activeApis = await this.apiModel.countDocuments({
      userId,
      isActive: true,
    });
    const healthyApis = await this.apiModel.countDocuments({
      userId,
      healthStatus: 'healthy',
    });
    const unhealthyApis = await this.apiModel.countDocuments({
      userId,
      healthStatus: { $in: ['unhealthy', 'error'] },
    });

    // TODO: Calculate from ApiChange model when implemented
    const recentChanges = 0;
    const totalChanges = await this.apiModel.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$changeCount' } } },
    ]);

    return {
      totalApis,
      activeApis,
      healthyApis,
      unhealthyApis,
      recentChanges,
      totalChanges: totalChanges[0]?.total || 0,
    };
  }

  async refreshApi(id: string): Promise<{ changed: boolean; summary: string }> {
    const api = await this.apiModel.findById(id);
    if (!api) throw new NotFoundException('API not found');
    const oldSpec = api.latestSpec;

    // Fetch new spec
    const response = await axios.get(api.openApiUrl);
    const newSpec = response.data;

    // Diff
    const diff = diffOpenApi(oldSpec, newSpec);

    if (diff.changed) {
      // Save changelog
      await this.changelogModel.create({
        apiId: api._id,
        previousVersion: oldSpec.info?.version,
        newVersion: newSpec.info?.version,
        diffSummary: diff.summary,
      });

      // Update api doc
      api.latestSpec = newSpec;
      api.version = newSpec.info?.version;
      api.lastChecked = new Date();
      await api.save();
    } else {
      // Just update lastChecked
      api.lastChecked = new Date();
      await api.save();
    }

    return diff;
  }

  async getApisByTag(tag: string, userId: string): Promise<ApiResponseDto[]> {
    const apis = await this.apiModel
      .find({ userId, tags: tag })
      .sort({ createdAt: -1 });

    return apis.map((api) => this.toResponseDto(api));
  }

  private toResponseDto(api: any): ApiResponseDto {
    return {
      id: api._id.toString(),
      apiName: api.apiName,
      openApiUrl: api.openApiUrl,
      type: api.type,
      version: api.version,
      checkFrequency: api.checkFrequency,
      isActive: api.isActive,
      tags: api.tags,
      healthStatus: api.healthStatus,
      lastChecked: api.lastChecked,
      lastHealthCheck: api.lastHealthCheck,
      changeCount: api.changeCount,
      description: api.description,
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
    };
  }
}
