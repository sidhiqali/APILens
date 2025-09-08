import { Module } from '@nestjs/common';
import { ApisService } from './apis.service';
import { ApisController } from './apis.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Api, ApiSchema } from 'src/Schemas/api.schema';
import { Changelog, ChangelogSchema } from 'src/Schemas/changelog-schema';
import { ApiChange, ApiChangeSchema } from 'src/Schemas/api-change.schema';
import {
  ApiSnapshot,
  ApiSnapshotSchema,
} from 'src/Schemas/api-snapshot.schema';
import { ChangeDetectorService } from './change-detector.service';
import { IssueAnalyzerService } from './issue-analyzer.service';
import { SmartSchedulerService } from '../schedules/smart-scheduler.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Notification,
  NotificationSchema,
} from 'src/Schemas/notification.schema';
import { User, UserSchema } from 'src/Schemas/user.schema';
import { EmailService } from '../notifications/email.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Api.name, schema: ApiSchema },
      { name: Changelog.name, schema: ChangelogSchema },
      { name: ApiSnapshot.name, schema: ApiSnapshotSchema },
      { name: ApiChange.name, schema: ApiChangeSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    WebSocketModule,
  ],
  controllers: [ApisController],
  providers: [
    ApisService,
    ChangeDetectorService,
    IssueAnalyzerService,
    SmartSchedulerService,
    NotificationsService,
    EmailService,
  ],
  exports: [ApisService],
})
export class ApisModule {}
