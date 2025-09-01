import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [`'self'`, 'data:', 'https:'],
        },
      },
    }),
  );

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'vscode-webview://*',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('API Lens')
    .setDescription('Local API for API change tracking and notifications')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token', {
      type: 'http',
      in: 'cookie',
      scheme: 'bearer',
    })
    .addTag('auth', 'Authentication and user management endpoints')
    .addTag('apis', 'API registration, monitoring, and management')
    .addTag('notifications', 'Notification management and preferences')
    .addTag('schedules', 'Scheduled monitoring and health checks')
    .addTag('health', 'System health and status endpoints')
    .addServer('http://localhost:3000', 'Local server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
    customSiteTitle: 'API Lens - Local API Docs',
  });

  // Health endpoints are provided via HealthController (Terminus)

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});
