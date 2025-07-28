// api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { ApisModule } from './modules/apis/apis.module';
import { ChangelogsModule } from './modules/changelogs/changelogs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { UserModule } from './modules/user/user.module';

// Configuration
import configuration from './config/configuration';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Rate limiting
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

    // Scheduling
    ScheduleModule.forRoot(),

    // Database
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

    // Feature modules
    UserModule,
    AuthModule,
    ApisModule,
    ChangelogsModule,
    NotificationsModule,
    SchedulesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
