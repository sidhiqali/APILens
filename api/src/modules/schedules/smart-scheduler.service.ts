import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ApisService } from '../apis/apis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../../gateways/notifications.gateway';

@Injectable()
export class SmartSchedulerService {
  private readonly logger = new Logger(SmartSchedulerService.name);

  constructor(
    private readonly apisService: ApisService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    void this.initializeHealthStatuses();
  }

  private async initializeHealthStatuses(): Promise<void> {
    try {
      await this.apisService.initializeApiHealthStatuses();
      this.logger.log('Health status initialization completed');
    } catch (error) {
      this.logger.error(
        `Failed to initialize health statuses: ${error.message}`,
      );
    }
  }

  @Cron('*/2 * * * *')
  async handleApiChecking() {
    this.logger.log('Starting API monitoring cycle...');

    try {
      const apisToCheck = await this.apisService.getApisToCheck();

      if (apisToCheck.length === 0) {
        this.logger.log('No APIs need checking at this time');
        return;
      }

      this.logger.log(`Found ${apisToCheck.length} APIs to check`);

      const batchSize = 5;
      for (let i = 0; i < apisToCheck.length; i += batchSize) {
        const batch = apisToCheck.slice(i, i + batchSize);

        const promises = batch.map((api) =>
          this.checkSingleApi((api._id as any).toString()),
        );
        await Promise.allSettled(promises);

        if (i + batchSize < apisToCheck.length) {
          await this.delay(2000);
        }
      }

      this.logger.log('API monitoring cycle completed');
    } catch (error) {
      this.logger.error(`Error in API monitoring cycle: ${error.message}`);
    }
  }

  private async checkSingleApi(apiId: string): Promise<void> {
    try {
      const api = await this.apisService.getApiByIdInternal(apiId);
      if (!api) {
        this.logger.error(`API not found: ${apiId}`);
        return;
      }

      this.notificationsGateway.broadcastAPIUpdate(
        apiId,
        api.userId.toString(),
        {
          apiId,
          apiName: api.apiName,
          status: 'checking',
          lastChecked: new Date().toISOString(),
        },
      );

      const healthResult = await this.performSingleHealthCheck(api);
      const result = await this.apisService.checkApiForChanges(apiId);

      let finalHealthStatus = healthResult.healthStatus;
      if (result.hasChanges && finalHealthStatus === 'healthy') {
        finalHealthStatus = 'warning';
      }

      await this.apisService.updateApiHealth(apiId, {
        status: finalHealthStatus,
        lastChecked: new Date(),
      });

      this.notificationsGateway.broadcastAPIUpdate(
        apiId,
        api.userId.toString(),
        {
          apiId,
          apiName: api.apiName,
          status: finalHealthStatus,
          uptime: this.calculateUptime(api),
          lastChecked: new Date().toISOString(),
          changes: result.changes || [],
        },
      );

      if (result.hasChanges) {
        this.logger.log(`Changes detected for API ${apiId}`);

        this.notificationsGateway.broadcastAPIChange(
          apiId,
          api.userId.toString(),
          {
            id: `change_${Date.now()}`,
            apiId,
            apiName: api.apiName,
            changeType: this.determineChangeType(result.changes || []),
            severity: 'medium',
            summary: `${result.changes?.length || 0} changes detected`,
            details: result.changes,
            timestamp: new Date().toISOString(),
          },
        );

        await this.notificationsService.notifyApiChanges(
          apiId,
          result.changes ?? [],
          result.newVersion,
        );
      }
    } catch (error) {
      this.logger.error(`Error checking API ${apiId}: ${error.message}`);
      
      try {
        await this.apisService.updateApiHealth(apiId, {
          status: 'error',
          lastChecked: new Date(),
        });

        const api = await this.apisService.getApiByIdInternal(apiId);
        if (api) {
          this.notificationsGateway.broadcastAPIUpdate(
            apiId,
            api.userId.toString(),
            {
              apiId,
              apiName: api.apiName,
              status: 'error',
              lastChecked: new Date().toISOString(),
              error: error.message,
            },
          );
        }

        await this.notificationsService.notifyApiError(apiId, error.message);
      } catch (updateError) {
        this.logger.error(
          `Failed to update API health after error: ${updateError.message}`,
        );
      }
    }
  }

  private determineChangeType(changes: any[]): string {
    if (!changes || changes.length === 0) return 'schema';

    const hasBreakingChanges = changes.some(
      (change) => change.breaking || change.severity === 'critical',
    );

    return hasBreakingChanges ? 'breaking' : 'schema';
  }

  private async performSingleHealthCheck(api: any): Promise<{ healthStatus: string }> {
    try {
      const baseUrl = api.openApiUrl
        .replace(/\/[^/]*\.json.*$/, '')
        .replace(/\/[^/]*\.yaml.*$/, '');

      const healthUrl = `${baseUrl}/health`;
      const response = await axios.get(healthUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'APILens-HealthChecker/1.0' },
      });

      if (response.status >= 500) {
        return { healthStatus: 'error' };
      }
      if (response.status >= 400) {
        return { healthStatus: 'unhealthy' };
      }

      const status = String(response.data?.status || '').toLowerCase();
      if (status === 'error') return { healthStatus: 'error' };
      if (status === 'unhealthy') return { healthStatus: 'unhealthy' };
      if (status === 'degraded') return { healthStatus: 'unhealthy' };
      return { healthStatus: 'healthy' };
    } catch (error) {
      this.logger.warn(`Health check failed for ${api.apiName}: ${error.message}`);
      return { healthStatus: 'error' };
    }
  }

  private calculateUptime(api: any): number {
    const now = new Date();
    const lastChecked = api.lastChecked ? new Date(api.lastChecked) : now;
    const timeDiff = now.getTime() - lastChecked.getTime();
    
    if (
      timeDiff < 3600000 &&
      ['healthy', 'warning'].includes(api.healthStatus)
    ) {
      return 99.9;
    } else if (['unhealthy', 'degraded'].includes(api.healthStatus)) {
      return 95.0;
    } else if (api.healthStatus === 'error') {
      return 85.0;
    }
    
    return 99.0;
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async performHealthChecks() {
    this.logger.log('Starting health check cycle...');

    try {
      const deletedCount = await this.apisService.cleanupOldSnapshots();
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} old snapshots`);
      }

      await this.apisService.updateApiHealthScores();
      this.logger.log('Updated API health scores');
    } catch (error) {
      this.logger.error(`Error in health check cycle: ${error.message}`);
    }
  }
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async triggerImmediateCheck(): Promise<{ message: string; checked: number }> {
    this.logger.log('Manual trigger: checking all active APIs immediately');

    const apisToCheck = await this.apisService.getApisToCheck();

    const promises = apisToCheck.map((api) =>
      this.checkSingleApi((api._id as any).toString()),
    );
    await Promise.allSettled(promises);

    return {
      message: 'Immediate check completed',
      checked: apisToCheck.length,
    };
  }
}
