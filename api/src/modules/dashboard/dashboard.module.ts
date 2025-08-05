import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Api, ApiSchema } from 'src/Schemas/api.schema';
import { ApiChange, ApiChangeSchema } from 'src/Schemas/api-change.schema';
import {
  Notification,
  NotificationSchema,
} from 'src/Schemas/notification.schema';
import { User, UserSchema } from 'src/Schemas/user.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Api.name, schema: ApiSchema },
      { name: ApiChange.name, schema: ApiChangeSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
