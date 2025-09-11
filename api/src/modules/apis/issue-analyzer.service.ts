import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Api } from 'src/Schemas/api.schema';
import { ApiChange } from 'src/Schemas/api-change.schema';

export interface ApiIssue {
  id: string;
  type:
    | 'health'
    | 'breaking_change'
    | 'schema_change'
    | 'performance'
    | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  relatedChangeId?: string;
  details?: {
    changes?: any[];
    affectedEndpoints?: string[];
    suggestions?: string[];
    metric?: string;
    current?: number;
    threshold?: number;
  };
}

@Injectable()
export class IssueAnalyzerService {
  private readonly logger = new Logger(IssueAnalyzerService.name);

  constructor(
    @InjectModel(Api.name) private apiModel: Model<Api>,
    @InjectModel(ApiChange.name) private apiChangeModel: Model<ApiChange>,
  ) {}

  // analyzes API health and recent changes
  async analyzeApiIssues(
    apiId: string,
    userId: string,
  ): Promise<{
    apiId: string;
    apiName: string;
    healthStatus: string;
    issueCount: number;
    issues: ApiIssue[];
    recentChanges: any[];
    lastChecked: Date;
  }> {
    const api = await this.apiModel
      .findById(apiId)
      .select('_id userId apiName healthStatus lastError lastChecked')
      .lean()
      .maxTimeMS(5000);

    if (!api) {
      throw new Error('API not found');
    }
    if (api.userId.toString() !== userId) {
      throw new Error('Access denied');
    }

    // Fetch recent changes for analysis 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentChanges = await this.apiChangeModel
      .find({
        apiId: new Types.ObjectId(apiId),
        detectedAt: { $gte: sevenDaysAgo },
      })
      .select(
        'changeType severity changes detectedAt summary fromVersion toVersion',
      )
      .sort({ detectedAt: -1 })
      .limit(10)
      .lean()
      .maxTimeMS(5000);

    const issues: ApiIssue[] = [];

    // Health status-based issue detection
    if (api.healthStatus === 'error' && api.lastError) {
      issues.push({
        id: 'api_error',
        type: 'availability',
        severity: 'critical',
        title: 'API Connection Failed',
        description: api.lastError,
        timestamp: api.lastChecked || new Date(),
        details: {
          metric: 'availability',
          current: 0,
          threshold: 100,
          suggestions: [
            'Check if the API server is running',
            'Verify the OpenAPI URL is accessible',
            'Check network connectivity',
          ],
        },
      });
    } else if (api.healthStatus === 'unhealthy') {
      issues.push({
        id: 'api_unhealthy',
        type: 'health',
        severity: 'high',
        title: 'API Health Degraded',
        description: 'API is reporting an unhealthy status',
        timestamp: api.lastChecked || new Date(),
        details: {
          suggestions: [
            'Run manual health check',
            'Review recent API changes',
            'Check server performance metrics',
          ],
        },
      });
    }

    // Change-based issue detection
    if (recentChanges.length > 0) {
      const breakingChanges = recentChanges.filter(
        (change) => change.changeType === 'breaking',
      );

      if (breakingChanges.length > 0) {
        issues.push({
          id: 'breaking_changes',
          type: 'breaking_change',
          severity: 'high',
          title: 'Breaking Changes Detected',
          description: `${breakingChanges.length} breaking changes found in recent updates`,
          timestamp: breakingChanges[0].detectedAt,
          relatedChangeId: breakingChanges[0]._id?.toString(),
          details: {
            changes: breakingChanges[0].changes || [],
            affectedEndpoints: this.extractAffectedEndpoints(
              breakingChanges[0].changes || [],
            ),
            suggestions: [
              'Review API documentation for migration guide',
              'Update client applications to handle changes',
              'Consider API versioning strategy',
            ],
          },
        });
      }

      // Schema modifications analysis
      const schemaChanges = recentChanges.filter(
        (change) =>
          change.changeType === 'modified' && change.severity !== 'low',
      );
      if (schemaChanges.length > 0) {
        issues.push({
          id: 'schema_changes',
          type: 'schema_change',
          severity: 'medium',
          title: 'Significant Schema Changes',
          description: `${schemaChanges.length} schema modifications detected`,
          timestamp: schemaChanges[0].detectedAt,
          relatedChangeId: schemaChanges[0]._id?.toString(),
          details: {
            changes: schemaChanges[0].changes?.slice(0, 3) || [],
            suggestions: [
              'Validate client compatibility',
              'Test data contracts',
              'Update API documentation',
            ],
          },
        });
      }

      // Critical severity changes analysis
      const criticalChanges = recentChanges.filter(
        (change) => change.severity === 'critical',
      );
      if (criticalChanges.length > 0) {
        issues.push({
          id: 'critical_changes',
          type: 'breaking_change',
          severity: 'critical',
          title: 'Critical API Changes',
          description: `${criticalChanges.length} critical changes require immediate attention`,
          timestamp: criticalChanges[0].detectedAt,
          relatedChangeId: criticalChanges[0]._id?.toString(),
          details: {
            changes: criticalChanges[0].changes || [],
            affectedEndpoints: this.extractAffectedEndpoints(
              criticalChanges[0].changes || [],
            ),
            suggestions: [
              'Immediate action required',
              'Notify all API consumers',
              'Prepare rollback plan if necessary',
            ],
          },
        });
      }
    }

    // Log analysis results for monitoring
    this.logger.log(
      `Analyzed API ${apiId}: found ${issues.length} issues and ${recentChanges.length} recent changes`,
    );

    return {
      apiId,
      apiName: api.apiName,
      healthStatus: api.healthStatus,
      issueCount: issues.length,
      issues,
      recentChanges,
      lastChecked: api.lastChecked || new Date(),
    };
  }

  private extractAffectedEndpoints(changes: any[]): string[] {
    if (!changes || !Array.isArray(changes)) return [];

    return changes
      .map((change) => change.path)
      .filter((path) => path && path.includes('/'))
      .map((path) => path.replace(/^paths\./, '').split('.')[0])
      .filter((endpoint, index, arr) => arr.indexOf(endpoint) === index)
      .slice(0, 5);
  }

  async getRecentChangesForApi(
    apiId: string,
    userId: string,
    limit: number = 10,
  ): Promise<any[]> {
    const api = await this.apiModel.findById(apiId).select('_id userId').lean();

    if (!api || api.userId.toString() !== userId) {
      return [];
    }

    return await this.apiChangeModel
      .find({ apiId: new Types.ObjectId(apiId) })
      .select(
        'changeType severity changes detectedAt summary fromVersion toVersion',
      )
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean()
      .maxTimeMS(5000);
  }

  async getAllIssuesForUser(userId: string): Promise<{
    totalIssues: number;
    criticalIssues: number;
    issues: Array<ApiIssue & { apiName: string; apiId: string }>;
  }> {
    const userApis = await this.apiModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('_id apiName healthStatus lastError lastChecked')
      .lean();

    const allIssues: Array<ApiIssue & { apiName: string; apiId: string }> = [];

    for (const api of userApis) {
      const analysis = await this.analyzeApiIssues(api._id.toString(), userId);
      allIssues.push(
        ...analysis.issues.map((issue) => ({
          ...issue,
          apiName: api.apiName,
          apiId: api._id.toString(),
        })),
      );
    }

    const criticalIssues = allIssues.filter(
      (issue) => issue.severity === 'critical',
    ).length;

    return {
      totalIssues: allIssues.length,
      criticalIssues,
      issues: allIssues.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
    };
  }
}
