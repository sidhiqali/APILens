import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios, { AxiosResponse } from 'axios';
import * as yaml from 'yaml';
import { CreateApiDto } from './dto/create-api.dto';
import { ApiResponseDto } from './dto/api-response.dto';
import { Api } from 'src/Schemas/api.schema';
import { OpenAPISpec } from 'src/types/api.type';
import { UpdateApiDto } from './dto/update-api.dto';
import { ApiHealthDto, ApiStatsDto } from './dto/api.dto';
import { Changelog } from 'src/Schemas/changelog-schema';
import { ApiSnapshot } from 'src/Schemas/api-snapshot.schema';
import { ChangeDetectorService } from './change-detector.service';
import { IssueAnalyzerService } from './issue-analyzer.service';
import { ApiChange } from 'src/Schemas/api-change.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApisService {
  private readonly logger = new Logger(ApisService.name);

  constructor(
    @InjectModel(Api.name) private apiModel: Model<Api>,
    @InjectModel(Changelog.name) private changelogModel: Model<Changelog>,
    @InjectModel(ApiSnapshot.name) private snapshotModel: Model<ApiSnapshot>,
    @InjectModel(ApiChange.name) private apiChangeModel: Model<ApiChange>,
    private changeDetectorService: ChangeDetectorService,
    public issueAnalyzerService: IssueAnalyzerService,
    private notificationsService: NotificationsService,
  ) {}

  async getAllApis(userId: string): Promise<ApiResponseDto[]> {
    const userObjectId = new Types.ObjectId(userId);
    const apis = await this.apiModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean();

    const apiIds = apis.map((api) => api._id);
    const changeCounts = await this.apiChangeModel.aggregate([
      { $match: { apiId: { $in: apiIds } } },
      { $group: { _id: '$apiId', count: { $sum: 1 } } },
    ]);
    const changeCountMap = new Map();
    changeCounts.forEach((item) => {
      changeCountMap.set(item._id.toString(), item.count);
    });

    const apisWithChangeCounts = apis.map((api) => ({
      ...api,
      changeCount: changeCountMap.get((api._id as any).toString()) || 0,
    }));

    return apisWithChangeCounts.map((api) => this.toResponseDto(api));
  }

  async getApisToCheck(): Promise<Api[]> {
    const now = new Date();
    const apis = await this.apiModel.find({ isActive: true });

    return apis.filter((api) => {
      if (!api.lastChecked) return true;

      const timeSinceLastCheck = now.getTime() - api.lastChecked.getTime();
      const checkInterval = this.getCheckIntervalMs(api.checkFrequency);

      return timeSinceLastCheck >= checkInterval;
    });
  }

  private getCheckIntervalMs(frequency: string): number {
    const intervals = {
      '30s': 30 * 1000,
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return intervals[frequency] || intervals['1h'];
  }

  async registerApi(
    dto: CreateApiDto,
    userId: string,
  ): Promise<ApiResponseDto> {
    try {
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
        userId: new Types.ObjectId(userId),
        checkFrequency: dto.checkFrequency || '1h',
        tags: dto.tags || [],
        description: dto.description,
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        changeCount: 0,
        isActive: true,
      });

      const savedApi = await api.save();

      await this.createSnapshot(
        (savedApi._id as any).toString(),
        response.data,
      );

      return this.toResponseDto(savedApi);
    } catch (error) {
      this.logger.error(`Failed to register API: ${error.message}`);
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
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

  async checkApiForChanges(apiId: string): Promise<{
    hasChanges: boolean;
    changes?: any[];
    newVersion?: string;
  }> {
    const api = await this.apiModel.findById(apiId);
    if (!api || !api.isActive) {
      return { hasChanges: false };
    }

    try {
      this.logger.log(`Checking API for changes: ${api.apiName}`);

      await this.apiModel.findByIdAndUpdate(apiId, {
        healthStatus: 'checking',
        lastHealthCheck: new Date(),
      });

      const response = await axios.get(api.openApiUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'API-Lens/1.0' },
      });

      const newSpec = response.data;
      const oldSpec = api.latestSpec;

      const baseUrl = api.openApiUrl
        .replace(/\/[^/]*\.json.*$/, '')
        .replace(/\/[^/]*\.yaml.*$/, '');

      let healthStatus = 'healthy';
      let healthErrorMessage: string | undefined;

      try {
        const healthUrl = `${baseUrl}/health`;
        const healthResponse = await axios.get(healthUrl, { timeout: 5000 });

        if (healthResponse.status >= 500) {
          healthStatus = 'error';
          healthErrorMessage = `Health endpoint returned ${healthResponse.status}`;
        } else if (healthResponse.status >= 400) {
          healthStatus = 'unhealthy';
          healthErrorMessage = `Health endpoint returned ${healthResponse.status}`;
        } else if (healthResponse.data?.status) {
          const status = healthResponse.data.status.toLowerCase();
          healthStatus =
            status === 'healthy'
              ? 'healthy'
              : status === 'degraded'
                ? 'unhealthy'
                : status === 'unhealthy'
                  ? 'unhealthy'
                  : status === 'error'
                    ? 'error'
                    : 'healthy';
        }
      } catch (healthError) {
        this.logger.warn(
          `Health check failed for ${api.apiName}: ${healthError.message}`,
        );
        healthErrorMessage = healthError.message;

        if (healthError.response?.status) {
          const statusCode = healthError.response.status;
          if (statusCode >= 500) {
            healthStatus = 'error';
          } else if (statusCode >= 400) {
            healthStatus = 'unhealthy';
          } else {
            healthStatus = 'healthy';
          }
        } else {
          healthStatus = 'error';
        }
      }

      const changeResult = await this.changeDetectorService.detectChanges(
        oldSpec,
        newSpec,
        apiId,
      );

      const previousHealthStatus = api.healthStatus;

      await this.apiModel.findByIdAndUpdate(apiId, {
        healthStatus,
        lastChecked: new Date(),
        lastHealthCheck: new Date(),
        lastError: healthErrorMessage || null,
      });

      if (previousHealthStatus && previousHealthStatus !== healthStatus) {
        await this.createHealthStatusNotification(
          apiId,
          api.apiName,
          previousHealthStatus,
          healthStatus,
          healthErrorMessage,
        );
      }

      if (changeResult.hasChanges) {
        await this.apiModel.findByIdAndUpdate(apiId, {
          latestSpec: newSpec,
          version: newSpec.info?.version || api.version,
          changeCount: api.changeCount + 1,
        });

        await this.createSnapshot(apiId, newSpec);

        await this.notificationsService.notifyApiChanges(
          apiId,
          changeResult.changes,
          newSpec.info?.version,
        );

        this.logger.log(`Changes detected for API: ${api.apiName}`);
        return {
          hasChanges: true,
          changes: changeResult.changes,
          newVersion: newSpec.info?.version,
        };
      }

      await this.apiModel.findByIdAndUpdate(apiId, {
        lastChecked: new Date(),
      });

      return { hasChanges: false };
    } catch (error) {
      this.logger.error(`Error checking API ${api.apiName}: ${error.message}`);

      const previousHealthStatus = api.healthStatus;

      await this.apiModel.findByIdAndUpdate(apiId, {
        healthStatus: 'error',
        lastHealthCheck: new Date(),
        lastError: error.message,
      });

      if (previousHealthStatus !== 'error') {
        await this.notificationsService.notifyApiError(apiId, error.message);
      }

      return { hasChanges: false };
    }
  }

  private async createSnapshot(apiId: string, spec: any): Promise<void> {
    try {
      await this.snapshotModel.create({
        apiId: new Types.ObjectId(apiId),
        version: spec.info?.version || 'unknown',
        spec,
        detectedAt: new Date(),
        metadata: {
          endpointCount: Object.keys(spec.paths || {}).length,
          schemaCount: Object.keys(spec.components?.schemas || {}).length,
          specSize: JSON.stringify(spec).length,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create snapshot: ${error.message}`);
    }
  }

  private async createHealthStatusNotification(
    apiId: string,
    apiName: string,
    oldStatus: string,
    newStatus: string,
    errorMessage?: string,
  ) {
    try {
      this.logger.log(
        `Health status change for ${apiName}: ${oldStatus} → ${newStatus}`,
      );

      if (newStatus === 'healthy' && oldStatus !== 'healthy') {
        this.logger.log(`Creating recovery notification for ${apiName}`);
        await this.notificationsService.notifyApiRecovered(apiId);
      } else if (newStatus === 'unhealthy' || newStatus === 'error') {
        const message =
          errorMessage || 'API endpoint is not responding properly';
        this.logger.log(
          `Creating error notification for ${apiName}: ${message}`,
        );
        await this.notificationsService.notifyApiError(apiId, message);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create health status notification for ${apiName}: ${error.message}`,
      );
    }
  }

  async getApiById(id: string, userId: string): Promise<ApiResponseDto> {
    const api = await this.apiModel
      .findById(id)
      .select(
        '_id apiName openApiUrl description tags isActive healthStatus checkFrequency lastChecked userId createdAt updatedAt version',
      )
      .lean()
      .maxTimeMS(10000);
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
    const api = await this.apiModel
      .findById(id)
      .select('_id userId')
      .lean()
      .maxTimeMS(5000);
    if (!api) {
      throw new NotFoundException('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedApi = await this.apiModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select(
        '_id apiName openApiUrl description tags isActive healthStatus checkFrequency lastChecked userId createdAt updatedAt version',
      )
      .lean()
      .maxTimeMS(10000);
    return this.toResponseDto(updatedApi);
  }

  async deleteApi(id: string, userId: string): Promise<void> {
    const api = await this.apiModel
      .findById(id)
      .select('_id userId')
      .lean()
      .maxTimeMS(5000);
    if (!api) {
      throw new NotFoundException('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await Promise.all([
      this.apiModel.findByIdAndDelete(id),
      this.snapshotModel.deleteMany({ apiId: id }),
      this.changelogModel.deleteMany({ apiId: id }),
    ]);
  }

  async testApiConnection(id: string, userId: string): Promise<ApiHealthDto> {
    const api = await this.getApiById(id, userId);

    try {
      await axios.get(api.openApiUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'API-Lens/1.0' },
      });

      await this.apiModel.findByIdAndUpdate(id, {
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        lastError: null,
      });

      return {
        id: api.id,
        apiName: api.apiName,
        status: 'healthy',
        lastChecked: new Date(),
        uptime: 100,
      };
    } catch (error) {
      const errorMessage = error.message || 'Connection failed';

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
    const userObjectId = new Types.ObjectId(userId);

    // Get user's API IDs for change counting
    const userApis = await this.apiModel
      .find({ userId: userObjectId }, '_id')
      .lean();
    const apiIds = userApis.map((api: any) => api._id);

    const [totalApis, activeApis, healthyApis, unhealthyApis, totalChanges] =
      await Promise.all([
        this.apiModel.countDocuments({ userId: userObjectId }),
        this.apiModel.countDocuments({ userId: userObjectId, isActive: true }),
        this.apiModel.countDocuments({
          userId: userObjectId,
          healthStatus: 'healthy',
        }),
        this.apiModel.countDocuments({
          userId: userObjectId,
          healthStatus: { $in: ['unhealthy', 'error'] },
        }),
        this.apiChangeModel.countDocuments({ apiId: { $in: apiIds } }),
      ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentChanges = await this.changelogModel.countDocuments({
      timestamp: { $gte: sevenDaysAgo },
    });

    return {
      totalApis,
      activeApis,
      healthyApis,
      unhealthyApis,
      recentChanges,
      totalChanges,
    };
  }

  async getApisByTag(tag: string, userId: string): Promise<ApiResponseDto[]> {
    const apis = await this.apiModel
      .find({
        userId: new Types.ObjectId(userId),
        tags: tag,
      })
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
  async getApiSnapshots(
    apiId: string,
    userId: string,
    limit: number = 10,
  ): Promise<any[]> {
    await this.getApiById(apiId, userId);

    return this.snapshotModel
      .find({ apiId: new Types.ObjectId(apiId) })
      .sort({ detectedAt: -1 })
      .limit(limit)
      .select('-spec')
      .lean();
  }

  async bulkToggleStatus(ids: string[], userId: string): Promise<void> {
    const apis = await this.apiModel.find({
      _id: { $in: ids },
      userId: userId,
    });

    const bulkOps = apis.map((api) => ({
      updateOne: {
        filter: { _id: api._id },
        update: { isActive: !api.isActive },
      },
    }));

    if (bulkOps.length > 0) {
      await this.apiModel.bulkWrite(bulkOps);
    }
  }

  async bulkDelete(ids: string[], userId: string): Promise<void> {
    await this.apiModel.deleteMany({
      _id: { $in: ids },
      userId: userId,
    });

    await this.changelogModel.deleteMany({ apiId: { $in: ids } });
  }

  async getApiDocumentation(id: string, userId: string): Promise<any> {
    const api = await this.apiModel
      .findOne({
        _id: id,
        userId: userId,
      })
      .select('latestSpec')
      .lean()
      .maxTimeMS(15000);

    if (!api) {
      throw new NotFoundException('API not found');
    }

    return api.latestSpec || {};
  }

  async cleanupOldSnapshots(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.snapshotModel.deleteMany({
      detectedAt: { $lt: thirtyDaysAgo },
    });

    return result.deletedCount;
  }

  async getApiByIdInternal(apiId: string): Promise<any> {
    return this.apiModel
      .findById(apiId)
      .select(
        '_id apiName openApiUrl userId isActive healthStatus checkFrequency lastChecked',
      )
      .lean()
      .maxTimeMS(10000);
  }

  async updateApiHealth(
    apiId: string,
    healthData: {
      status: string;
      lastChecked: Date;
    },
  ): Promise<void> {
    const updateData = {
      healthStatus: healthData.status,
      lastChecked: healthData.lastChecked,
      updatedAt: new Date(),
    };

    await this.apiModel.findByIdAndUpdate(apiId, { $set: updateData });
  }

  async updateApiHealthScores(): Promise<void> {
    const apis = await this.apiModel.find({ isActive: true });

    for (const api of apis) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentSnapshots = await this.snapshotModel
        .find({
          apiId: api._id,
          detectedAt: { $gte: sevenDaysAgo },
        })
        .sort({ detectedAt: -1 });

      if (recentSnapshots.length > 0) {
        const totalDays = 7;
        const daysWithSnapshots = new Set(
          recentSnapshots.map(
            (snapshot) => snapshot.detectedAt.toISOString().split('T')[0],
          ),
        ).size;

        const healthScore = (daysWithSnapshots / totalDays) * 100;

        let finalScore = Math.round(healthScore);
        if (api.healthStatus === 'healthy') {
          finalScore = Math.min(100, finalScore + 20);
        } else if (api.healthStatus === 'error') {
          finalScore = Math.max(0, finalScore - 30);
        }

        await this.apiModel.findByIdAndUpdate(api._id, {
          healthScore: finalScore,
          lastHealthUpdate: new Date(),
        });
      }
    }
  }

  async validateApiUrl(url: string): Promise<{
    valid: boolean;
    accessible: boolean;
    error?: string;
  }> {
    try {
      new URL(url);

      const response = await axios.head(url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      return {
        valid: true,
        accessible: response.status < 500,
      };
    } catch (error) {
      return {
        valid: false,
        accessible: false,
        error: (error as Error).message,
      };
    }
  }

  async testOpenApiUrl(url: string): Promise<{
    valid: boolean;
    accessible?: boolean;
    spec?: any;
    error?: string;
    metadata?: {
      title?: string;
      version?: string;
      description?: string;
      endpoints?: number;
    };
  }> {
    try {
      new URL(url);

      this.logger.log(`Testing OpenAPI URL: ${url}`);

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          Accept: 'application/json, application/yaml, text/yaml, */*',
          'User-Agent': 'APILens/1.0.0',
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status >= 400) {
        return {
          valid: false,
          accessible: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      let spec: any;
      const contentType = response.headers['content-type'] || '';

      try {
        if (
          contentType.includes('json') ||
          response.data.toString().trim().startsWith('{')
        ) {
          spec =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
        } else {
          spec = yaml.parse(response.data.toString());
        }
      } catch (parseError) {
        return {
          valid: false,
          accessible: true,
          error: `Failed to parse specification: ${parseError.message}`,
        };
      }

      if (!spec || typeof spec !== 'object') {
        return {
          valid: false,
          accessible: true,
          error: 'Invalid specification format: not a valid object',
        };
      }

      const isOpenAPI3 = spec.openapi && spec.openapi.startsWith('3.');
      const isSwagger2 = spec.swagger && spec.swagger.startsWith('2.');

      if (!isOpenAPI3 && !isSwagger2) {
        return {
          valid: false,
          accessible: true,
          error:
            'Not a valid OpenAPI/Swagger specification. Missing version field.',
        };
      }

      if (!spec.info) {
        return {
          valid: false,
          accessible: true,
          error: 'Invalid specification: missing info section',
        };
      }

      if (!spec.paths && !spec.components) {
        return {
          valid: false,
          accessible: true,
          error: 'Invalid specification: missing paths or components section',
        };
      }

      const metadata = {
        title: spec.info?.title || 'Untitled API',
        version: spec.info?.version || '1.0.0',
        description: spec.info?.description || '',
        endpoints: spec.paths ? Object.keys(spec.paths).length : 0,
      };

      this.logger.log(
        `Valid OpenAPI specification found: ${metadata.title} v${metadata.version}`,
      );

      return {
        valid: true,
        accessible: true,
        spec: {
          info: spec.info,
          openapi: spec.openapi,
          swagger: spec.swagger,
          paths: spec.paths ? Object.keys(spec.paths) : [],
          components: spec.components ? Object.keys(spec.components) : [],
        },
        metadata,
      };
    } catch (error) {
      this.logger.error(`Error testing OpenAPI URL ${url}:`, error.message);

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          valid: false,
          accessible: false,
          error: `Cannot connect to ${url}. Please check the URL and try again.`,
        };
      } else if (error.code === 'ETIMEDOUT') {
        return {
          valid: false,
          accessible: false,
          error: 'Request timed out. The server may be slow or unreachable.',
        };
      } else {
        return {
          valid: false,
          accessible: false,
          error: error.message,
        };
      }
    }
  }

  async getApiHealthIssues(id: string, userId: string): Promise<any> {
    try {
      return await this.issueAnalyzerService.analyzeApiIssues(id, userId);
    } catch (error) {
      this.logger.error(`Error getting health issues for API ${id}: ${error.message}`);
      throw new NotFoundException(error.message);
    }
  }

  async fixHealthStatuses(
    userId: Types.ObjectId,
  ): Promise<{ message: string; updated: number }> {
    try {
      this.logger.log('Fixing health statuses...');

      const result = await this.apiModel.updateMany(
        { userId },
        {
          $set: {
            healthStatus: 'healthy',
            lastChecked: new Date(),
            lastHealthCheck: new Date(),
          },
        },
      );

      this.logger.log(
        `Fixed health statuses for ${result.modifiedCount} APIs.`,
      );
      return {
        message: `Successfully updated ${result.modifiedCount} APIs`,
        updated: result.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Error fixing health statuses:', error.message);
      throw new Error(`Failed to fix health statuses: ${error.message}`);
    }
  }

  async initializeApiHealthStatuses(): Promise<void> {
    this.logger.log(
      'Initializing health statuses for APIs without health data...',
    );

    try {
      const allApis = await this.apiModel.find({});
      let needsUpdate = 0;

      for (const api of allApis) {
        const needsHealthUpdate =
          !api.healthStatus ||
          api.healthStatus === 'unknown' ||
          !api.lastChecked;

        if (needsHealthUpdate) {
          needsUpdate++;

          try {
            const initialStatus = api.isActive ? 'healthy' : 'inactive';

            await this.apiModel.findByIdAndUpdate(api._id, {
              healthStatus: initialStatus,
              lastChecked: new Date(),
              lastHealthCheck: new Date(),
            });
          } catch (error) {
            this.logger.error(
              `Failed to update health status for ${api.apiName}: ${error.message}`,
            );
          }
        }
      }

      if (needsUpdate === 0) {
        this.logger.log('All APIs already have proper health status');
      } else {
        this.logger.log(
          `Successfully updated health status for ${needsUpdate} APIs`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error during health status initialization: ${error.message}`,
      );
    }
  }
}
