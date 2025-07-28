// api/src/config/configuration.ts
export default (): Record<string, any> => ({
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/api-lens',
    options: {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@apilens.com',
  },

  app: {
    name: 'API Lens',
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    environment: process.env.NODE_ENV || 'development',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  monitoring: {
    defaultCheckFrequency: process.env.DEFAULT_CHECK_FREQUENCY || '1h',
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '10', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  notifications: {
    defaultChannels: process.env.DEFAULT_NOTIFICATION_CHANNELS?.split(',') || [
      'in-app',
      'email',
    ],
    webhookTimeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10),
    emailRetries: parseInt(process.env.EMAIL_RETRIES || '3', 10),
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    tokenLength: parseInt(process.env.TOKEN_LENGTH || '32', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 minutes
  },

  storage: {
    maxSnapshotRetention: parseInt(
      process.env.MAX_SNAPSHOT_RETENTION || '30',
      10,
    ), // days
    maxChangelogRetention: parseInt(
      process.env.MAX_CHANGELOG_RETENTION || '90',
      10,
    ), // days
    compressionEnabled: process.env.COMPRESSION_ENABLED === 'true',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logDirectory: process.env.LOG_DIRECTORY || './logs',
  },

  features: {
    enableWebhooks: process.env.ENABLE_WEBHOOKS !== 'false',
    enableEmailNotifications:
      process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  },

  external: {
    swaggerValidatorUrl:
      process.env.SWAGGER_VALIDATOR_URL ||
      'https://validator.swagger.io/validator',
    openApiValidatorEnabled: process.env.OPENAPI_VALIDATOR_ENABLED === 'true',
  },
});

// Environment validation schema
export const configValidationSchema = {
  NODE_ENV: {
    choices: ['development', 'production', 'test'],
    default: 'development',
  },
  PORT: {
    type: 'number',
    default: 3000,
  },
  MONGO_URI: {
    type: 'string',
    required: true,
  },
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
  },
  FRONTEND_URL: {
    type: 'string',
    format: 'url',
    required: true,
  },
};
