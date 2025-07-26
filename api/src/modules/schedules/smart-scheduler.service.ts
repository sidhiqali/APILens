import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApisService } from '../apis/apis.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SmartSchedulerService {
  private readonly logger = new Logger(SmartSchedulerService.name);

  constructor(
    private readonly apisService: ApisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Run every 5 minutes to check for APIs that need monitoring
  @Cron('*/5 * * * *')
  async handleApiChecking() {
    this.logger.log('Starting API monitoring cycle...');

    try {
      // Get APIs that need checking based on their individual frequencies
      const apisToCheck = await this.apisService.getApisToCheck();

      if (apisToCheck.length === 0) {
        this.logger.log('No APIs need checking at this time');
        return;
      }

      this.logger.log(`Found ${apisToCheck.length} APIs to check`);

      // Process APIs in batches to avoid overwhelming external services
      const batchSize = 10;
      for (let i = 0; i < apisToCheck.length; i += batchSize) {
        const batch = apisToCheck.slice(i, i + batchSize);

        // Process batch concurrently but with limited concurrency
        const promises = batch.map((api) =>
          this.checkSingleApi((api._id as any).toString()),
        );
        await Promise.allSettled(promises);

        // Small delay between batches
        if (i + batchSize < apisToCheck.length) {
          await this.delay(1000); // 1 second delay
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

      const result = await this.apisService.checkApiForChanges(apiId);

      if (result.hasChanges) {
        this.logger.log(`Changes detected for API ${apiId}`);

        // Send notifications for the changes
        await this.notificationsService.notifyApiChanges(
          apiId,
          result.changes ?? [],
          result.newVersion,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to check API ${apiId}: ${error.message}`);

      // Notify about API error
      await this.notificationsService.notifyApiError(apiId, error.message);
    }
  }

  // Health check every hour
  @Cron(CronExpression.EVERY_HOUR)
  private performHealthChecks() {
    this.logger.log('Starting health check cycle...');

    try {
      // This could check system health, cleanup old data, etc.
      this.cleanupOldSnapshots();
      this.updateApiHealthScores();
    } catch (error) {
      this.logger.error(`Error in health check cycle: ${error.message}`);
    }
  }

  private cleanupOldSnapshots(): void {
    // Implement cleanup logic for old snapshots (keep last 30 days)
    this.logger.log('Cleaning up old snapshots...');
    // Implementation here
  }

  private updateApiHealthScores(): void {
    // Update API health scores based on recent checks
    this.logger.log('Updating API health scores...');
    // Implementation here
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Manual trigger for immediate checking of all APIs
  async triggerImmediateCheck(): Promise<{ message: string; checked: number }> {
    this.logger.log('Manual trigger: checking all active APIs immediately');

    const apisToCheck = await this.apisService.getApisToCheck();

    // Process all APIs without frequency restrictions
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
