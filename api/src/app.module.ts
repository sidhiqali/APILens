import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ApisModule } from './modules/apis/apis.module';
import { ChangelogsModule } from './modules/changelogs/changelogs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { UserModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import configuration from './config/configuration';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl:
              configService.get<number>('monitoring.rateLimitWindow') ?? 60000,
            limit: configService.get<number>('monitoring.rateLimitMax') ?? 100,
          },
        ],
      }),
    }),

    // for cron jobs and scheduled tasks
    ScheduleModule.forRoot(),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const databaseOptions =
          (await configService.get('database.options')) || {};
        return {
          uri: configService.get<string>('database.uri'),
          ...databaseOptions,
        };
      },
    }),
    UserModule,
    AuthModule,
    ApisModule,
    ChangelogsModule,
    NotificationsModule,
    SchedulesModule,
    DashboardModule,
    HealthModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
