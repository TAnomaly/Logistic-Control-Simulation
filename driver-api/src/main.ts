import { NestFactory } from '@nestjs/core';
import { DriverModule } from './driver.module';

async function bootstrap() {
    const app = await NestFactory.create(DriverModule);

    // Enable CORS
    app.enableCors();

    // Set global prefix
    app.setGlobalPrefix('api');

    // Start the application
    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚗 Driver API is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
    console.log(`🗄️ Database: PostgreSQL (driver_db)`);
    console.log(`📨 Message Broker: RabbitMQ`);
    console.log(`⚡ Cache: Redis`);
}

bootstrap(); 