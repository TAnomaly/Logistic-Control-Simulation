import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global ValidationPipe - DTO'ları otomatik transform eder ve validate eder
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // DTO'ları otomatik transform et
      whitelist: true, // Sadece DTO'da tanımlı alanları al
      forbidNonWhitelisted: true, // Ekstra alanları reddet
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
