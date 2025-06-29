import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApisModule } from './modules/apis/apis.module';
import { ChangelogsModule } from './modules/changelogs/changelogs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulesModule } from './modules/schedules/schedules.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ApisModule,
    ChangelogsModule,
    NotificationsModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
