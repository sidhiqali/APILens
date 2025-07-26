// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { ApisService } from './apis.service';

// @Injectable()
// export class ApiRefreshScheduler {
//   private readonly logger = new Logger(ApiRefreshScheduler.name);

//   constructor(private readonly apisService: ApisService) {}

//   @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // or EVERY_12_HOURS, etc.
//   async handleCron() {
//     this.logger.log('Scheduled API refresh started...');
//     try {
//       // Get all APIs
//       const apis = await this.apisService.getAllApis();
//       for (const api of apis) {
//         try {
//           await this.apisService.refreshApi(api.id);
//           this.logger.log(`Refreshed API: ${api.apiName} (${api.openApiUrl})`);
//         } catch (e) {
//           this.logger.error(`Failed to refresh ${api.apiName}: ${e.message}`);
//         }
//       }
//       this.logger.log('Scheduled API refresh finished.');
//     } catch (e) {
//       this.logger.error('Error in scheduled API refresh: ' + e.message);
//     }
//   }
// }
