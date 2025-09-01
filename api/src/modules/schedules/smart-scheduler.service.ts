import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
  ) {}

  @Cron('*/5 * * * *')
  async handleApiChecking() {
    this.logger.log('Starting API monitoring cycle...');

    try {
      const apisToCheck = await this.apisService.getApisToCheck();

      if (apisToCheck.length === 0) {
        this.logger.log('No APIs need checking at this time');
        return;
      }

      this.logger.log(`Found ${apisToCheck.length} APIs to check`);

      const batchSize = 10;
      for (let i = 0; i < apisToCheck.length; i += batchSize) {
        const batch = apisToCheck.slice(i, i + batchSize);

        const promises = batch.map((api) =>
          this.checkSingleApi((api._id as any).toString()),
        );
        await Promise.allSettled(promises);

        if (i + batchSize < apisToCheck.length) {
          await this.delay(1000);
        }
      }

      this.logger.log('API monitoring cycle completed');
    } catch (error) {
      this.logger.error(`Error in API monitoring cycle: ${error.message}`);
    }
  }

  private async checkSingleApi(apiId: string): Promise<void> {
    try {
      this.logger.debug(`Checking API: ${apiId}`);

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

      const result = await this.apisService.checkApiForChanges(apiId);

      const healthStatus = result.hasChanges ? 'unhealthy' : 'healthy';

      await this.apisService.updateApiHealth(apiId, {
        status: healthStatus,
        lastChecked: new Date(),
        responseTime: 200,
      });

      this.notificationsGateway.broadcastAPIUpdate(
        apiId,
        api.userId.toString(),
        {
          apiId,
          apiName: api.apiName,
          status: healthStatus,
          responseTime: 200,
          uptime: 99.9,
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
      this.logger.error(`Failed to check API ${apiId}: ${error.message}`);

      const api = await this.apisService.getApiByIdInternal(apiId);
      if (api) {
        this.notificationsGateway.broadcastAPIUpdate(
          apiId,
          api.userId.toString(),
          {
            apiId,
            apiName: api.apiName,
            status: 'unhealthy',
            lastChecked: new Date().toISOString(),
            error: error.message,
          },
        );
      }

      await this.notificationsService.notifyApiError(apiId, error.message);
    }
  }

  private determineChangeType(changes: any[]): string {
    if (!changes || changes.length === 0) return 'schema';

    const hasBreakingChanges = changes.some(
      (change) => change.breaking || change.severity === 'critical',
    );

    return hasBreakingChanges ? 'breaking' : 'schema';
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
