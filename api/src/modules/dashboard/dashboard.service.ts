import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Api } from 'src/Schemas/api.schema';
import { ApiChange } from 'src/Schemas/api-change.schema';
import { Notification } from 'src/Schemas/notification.schema';
import { User } from 'src/Schemas/user.schema';
import {
  DashboardStatsDto,
  RecentActivityDto,
  ApiHealthSummaryDto,
  DashboardOverviewDto,
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Api.name) private apiModel: Model<Api>,
    @InjectModel(ApiChange.name) private apiChangeModel: Model<ApiChange>,
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getDashboardOverview(userId: string): Promise<DashboardOverviewDto> {
    const [stats, recentActivity, apiHealthSummary, criticalAlerts] =
      await Promise.all([
        this.getDashboardStats(userId),
        this.getRecentActivity(userId, 10),
        this.getApiHealthSummary(userId),
        this.getCriticalAlerts(userId, 5),
      ]);

    return {
      stats,
      recentActivity,
      apiHealthSummary,
      criticalAlerts,
    };
  }

  async getDashboardStats(userId: string): Promise<DashboardStatsDto> {
    const userObjectId = new Types.ObjectId(userId);

    // Date ranges for filtering
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // API Statistics
    const [totalApis, activeApis, healthyApis, unhealthyApis] =
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
      ]);

    // Get user's API IDs for filtering changes and notifications
    const userApis = await this.apiModel
      .find({ userId: userObjectId }, '_id')
      .lean();
    const apiIds = userApis.map((api: any) => api._id);

    // Change Statistics
    const [totalChanges, recentChanges, breakingChanges, nonBreakingChanges] =
      await Promise.all([
        this.apiChangeModel.countDocuments({ apiId: { $in: apiIds } }),
        this.apiChangeModel.countDocuments({
          apiId: { $in: apiIds },
          detectedAt: { $gte: sevenDaysAgo },
        }),
        this.apiChangeModel.countDocuments({
          apiId: { $in: apiIds },
          detectedAt: { $gte: thirtyDaysAgo },
          changeType: 'breaking',
        }),
        this.apiChangeModel.countDocuments({
          apiId: { $in: apiIds },
          detectedAt: { $gte: thirtyDaysAgo },
          changeType: { $ne: 'breaking' },
        }),
      ]);

    // Critical Issues: APIs with error status OR high change count (same as issues page)
    const criticalIssues = await this.apiModel.countDocuments({
      userId: userObjectId,
      $or: [{ healthStatus: 'error' }, { changeCount: { $gt: 5 } }],
    });

    // Notification Statistics
    const [totalNotifications, unreadNotifications, recentNotifications] =
      await Promise.all([
        this.notificationModel.countDocuments({ userId: userObjectId }),
        this.notificationModel.countDocuments({
          userId: userObjectId,
          read: false,
        }),
        this.notificationModel.countDocuments({
          userId: userObjectId,
          createdAt: { $gte: sevenDaysAgo },
        }),
      ]);

    // Most Active API
    const mostActiveApiResult = await this.apiModel
      .findOne({ userId: userObjectId })
      .sort({ changeCount: -1 })
      .select('_id apiName changeCount')
      .lean();

    const mostActiveApi = mostActiveApiResult
      ? {
          id: (mostActiveApiResult._id as any).toString(),
          name: mostActiveApiResult.apiName,
          changeCount: mostActiveApiResult.changeCount || 0,
        }
      : null;

    // Health Statistics
    const healthStats = await this.apiModel.aggregate([
      { $match: { userId: userObjectId, isActive: true } },
      {
        $group: {
          _id: null,
          healthyCount: {
            $sum: { $cond: [{ $eq: ['$healthStatus', 'healthy'] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const healthResult = healthStats[0] || {
      healthyCount: 0,
      totalCount: 0,
    };
    const uptimePercentage =
      healthResult.totalCount > 0
        ? Math.round(
            (healthResult.healthyCount / healthResult.totalCount) * 100,
          )
        : 0;

    return {
      totalApis,
      activeApis,
      healthyApis,
      unhealthyApis,
      totalChanges,
      criticalIssues, // Use the new calculation
      recentChanges,
      breakingChanges,
      nonBreakingChanges,
      totalNotifications,
      unreadNotifications,
      recentNotifications,
      mostActiveApi,
      avgResponseTime: 0,
      uptimePercentage,
    };
  }

  async getRecentActivity(
    userId: string,
    limit: number = 10,
  ): Promise<RecentActivityDto[]> {
    const userObjectId = new Types.ObjectId(userId);

    // Get user's API IDs and create mapping
    const userApis = await this.apiModel
      .find({ userId: userObjectId }, '_id apiName')
      .lean();
    const apiIds = userApis.map((api: any) => api._id);
    const apiMap = new Map(
      userApis.map((api: any) => [api._id.toString(), api.apiName]),
    );

    // Get recent changes
    const recentChanges = await this.apiChangeModel
      .find({ apiId: { $in: apiIds } })
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();

    // Get recent notifications
    const recentNotifications = await this.notificationModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const activities: RecentActivityDto[] = [];

    // Add API changes
    recentChanges.forEach((change: any) => {
      const apiId = change.apiId.toString();
      activities.push({
        id: change._id.toString(),
        type: 'api_change',
        title: 'API Change Detected',
        description: `${change.changes?.length || 0} changes in ${apiMap.get(apiId) || 'Unknown API'}`,
        timestamp: change.detectedAt,
        apiId,
        apiName: apiMap.get(apiId),
        severity: this.mapSeverity(change.severity),
      });
    });

    // Add notifications
    recentNotifications.forEach((notification: any) => {
      const apiId = notification.apiId?.toString();
      activities.push({
        id: notification._id.toString(),
        type: 'notification',
        title: notification.title,
        description: notification.message,
        timestamp: notification.createdAt,
        apiId,
        apiName: apiId ? apiMap.get(apiId) : undefined,
        severity: this.mapSeverity(notification.severity),
      });
    });

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getApiHealthSummary(userId: string): Promise<ApiHealthSummaryDto[]> {
    const userObjectId = new Types.ObjectId(userId);

    const apis = await this.apiModel
      .find({ userId: userObjectId })
      .select('_id apiName healthStatus lastChecked changeCount isActive')
      .sort({ lastChecked: -1 })
      .lean();

    return apis.map((api: any) => ({
      id: api._id.toString(),
      name: api.apiName,
      status: this.mapHealthStatus(api.healthStatus),
      lastChecked: api.lastChecked || new Date(),
      changeCount: api.changeCount || 0,
      isActive: api.isActive !== false,
    }));
  }

  async getCriticalAlerts(
    userId: string,
    limit: number = 5,
  ): Promise<RecentActivityDto[]> {
    const userObjectId = new Types.ObjectId(userId);

    // Get user's API IDs and create mapping
    const userApis = await this.apiModel
      .find({ userId: userObjectId }, '_id apiName')
      .lean();
    const apiIds = userApis.map((api: any) => api._id);
    const apiMap = new Map(
      userApis.map((api: any) => [api._id.toString(), api.apiName]),
    );

    const criticalAlerts: RecentActivityDto[] = [];

    // Get critical API changes
    const criticalChanges = await this.apiChangeModel
      .find({
        apiId: { $in: apiIds },
        $or: [{ severity: 'critical' }, { changeType: 'breaking' }],
      })
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();

    criticalChanges.forEach((change: any) => {
      const apiId = change.apiId.toString();
      criticalAlerts.push({
        id: change._id.toString(),
        type: 'api_change',
        title: 'Critical API Change',
        description: `Breaking change detected in ${apiMap.get(apiId) || 'Unknown API'}`,
        timestamp: change.detectedAt,
        apiId,
        apiName: apiMap.get(apiId),
        severity: 'critical',
      });
    });

    // Get unhealthy APIs
    const unhealthyApis = await this.apiModel
      .find({
        userId: userObjectId,
        healthStatus: { $in: ['unhealthy', 'error'] },
      })
      .sort({ lastChecked: -1 })
      .limit(limit)
      .lean();

    unhealthyApis.forEach((api: any) => {
      const apiId = api._id.toString();
      criticalAlerts.push({
        id: apiId,
        type: 'api_health',
        title: 'API Health Issue',
        description: `${api.apiName} is ${api.healthStatus}`,
        timestamp: api.lastChecked || new Date(),
        apiId,
        apiName: api.apiName,
        severity: 'high',
      });
    });

    return criticalAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getApiChangesTrend(
    userId: string,
    days: number = 30,
  ): Promise<{ date: string; count: number }[]> {
    const userObjectId = new Types.ObjectId(userId);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get user's API IDs
    const userApis = await this.apiModel
      .find({ userId: userObjectId }, '_id')
      .lean();
    const apiIds = userApis.map((api: any) => api._id);

    const trend = await this.apiChangeModel.aggregate([
      {
        $match: {
          apiId: { $in: apiIds },
          detectedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$detectedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return trend.map((item: any) => ({
      date: item._id,
      count: item.count,
    }));
  }

  private mapSeverity(
    severity: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
      default:
        return 'low';
    }
  }

  private mapHealthStatus(
    status: string,
  ): 'healthy' | 'unhealthy' | 'checking' | 'error' {
    switch (status) {
      case 'healthy':
        return 'healthy';
      case 'unhealthy':
        return 'unhealthy';
      case 'error':
        return 'error';
      case 'checking':
      default:
        return 'checking';
    }
  }
}
