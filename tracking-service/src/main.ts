import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { TrackingModule } from './tracking.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(TrackingModule);

    // Enable CORS
    app.enableCors({
        origin: true,
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));

    // Global prefix
    app.setGlobalPrefix('api');

    // Serve static files
    app.useStaticAssets(join(__dirname, '..', 'public'));

    const port = process.env.PORT || 8002;
    await app.listen(port);

    console.log(`🚀 Tracking Service is running on: http://localhost:${port}`);
    console.log(`📊 Driver Tracking API: http://localhost:${port}/api/drivers`);
    console.log(`🔌 WebSocket Gateway: ws://localhost:${port}`);
}

bootstrap(); 