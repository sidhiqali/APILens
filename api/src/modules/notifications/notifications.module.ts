import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import {
  Notification,
  NotificationSchema,
} from 'src/Schemas/notification.schema';
import { Api, ApiSchema } from 'src/Schemas/api.schema';
import { User, UserSchema } from 'src/Schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Api.name, schema: ApiSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService], // Export for use in scheduler
})
export class NotificationsModule {}
