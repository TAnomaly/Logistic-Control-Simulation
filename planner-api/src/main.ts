import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlannerModule } from './planner.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CustomLogger } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(PlannerModule, {
    logger: new CustomLogger(),
  });

  const configService = app.get(ConfigService);
  const logger = app.get(CustomLogger);

  // Enable CORS with proper configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*').split(','),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Correlation-ID'],
  });

  // Global validation pipe with enhanced configuration
  // app.useGlobalPipes(new ValidationPipe({
  //   transform: true,
  //   whitelist: true,
  //   forbidNonWhitelisted: true,
  //   transformOptions: {
  //     enableImplicitConversion: true,
  //   },
  //   errorHttpStatusCode: 422,
  // }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global prefix
  app.setGlobalPrefix('api');

  // Security headers middleware
  app.use((req: any, res: any, next: any) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  const port = configService.get('PORT', 3000);
  const environment = configService.get('NODE_ENV', 'development');

  await app.listen(port);

  logger.log(`🚀 Planner API started successfully`, 'Bootstrap');
  logger.log(`📍 Environment: ${environment}`, 'Bootstrap');
  logger.log(`🌐 Server: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📊 API Documentation: http://localhost:${port}/api/shipments`, 'Bootstrap');
  logger.log(`🔐 Authentication: http://localhost:${port}/api/auth`, 'Bootstrap');
  logger.log(`❤️  Health Check: http://localhost:${port}/api/health`, 'Bootstrap');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully', 'Bootstrap');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully', 'Bootstrap');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
}); 