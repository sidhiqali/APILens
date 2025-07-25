import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ApisModule } from './modules/apis/apis.module';
import { ChangelogsModule } from './modules/changelogs/changelogs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI || '',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      }),
    }),
    UserModule,
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
