import { NestFactory } from '@nestjs/core';
import { PlannerModule } from './planner.module';

async function bootstrap() {
  const app = await NestFactory.create(PlannerModule);

  // Enable CORS
  app.enableCors();

  // Set global prefix
  app.setGlobalPrefix('api');

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`📋 Planner API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
  console.log(`🗄️ Database: PostgreSQL (planner_db)`);
  console.log(`📨 Message Broker: RabbitMQ`);
  console.log(`⚡ Cache: Redis`);
}

bootstrap(); 