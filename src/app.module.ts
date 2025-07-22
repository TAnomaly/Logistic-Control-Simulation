import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogisticsModule } from './logistics.module';

/**
 * AppModule - Ana uygulama modülü
 * Tüm feature module'leri burada import edilir
 */
@Module({
  imports: [
    LogisticsModule, // Lojistik kontrol simülasyon modülü
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
