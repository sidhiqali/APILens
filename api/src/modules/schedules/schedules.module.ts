import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { SmartSchedulerService } from './smart-scheduler.service';
import { ApisModule } from '../apis/apis.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ApisModule, NotificationsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, SmartSchedulerService],
  exports: [SmartSchedulerService],
})
export class SchedulesModule {}
