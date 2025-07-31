import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MlModule } from './ml.module';

async function bootstrap() {
    const app = await NestFactory.create(MlModule);

    // Enable CORS
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
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

    const port = process.env.PORT || 8000;
    await app.listen(port);

    console.log(`🚀 ML Service is running on: http://localhost:${port}`);
    console.log(`📊 Route Optimization API: http://localhost:${port}/api/optimize-route`);
}

bootstrap(); 