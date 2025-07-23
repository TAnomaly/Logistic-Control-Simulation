import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
// import { ScheduleModule } from '@nestjs/schedule';

// Domain Entities
import { Shipment } from './domain/entities/shipment.entity';
import { TrackingEvent } from './domain/entities/tracking-event.entity';
import { Gate } from './domain/entities/gate.entity';
import { OutboxEvent } from './domain/entities/outbox-event.entity';

// Infrastructure
import { createTypeOrmConfig } from './infrastructure/database/database.config';
import { TypeOrmShipmentRepository } from './infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmOutboxEventRepository } from './infrastructure/repositories/typeorm-outbox-event.repository';
import { RedisService } from './infrastructure/redis/redis.service';
import { OutboxService } from './infrastructure/outbox/outbox.service';

// Application Layer - Commands & Queries Handlers
import { CreateShipmentHandler } from './application/handlers/create-shipment.handler';
import { GetShipmentByTrackingHandler } from './application/handlers/get-shipment-by-tracking.handler';

// Event Handlers
import { ShipmentCreatedEventHandler } from './application/events/handlers/shipment-created.handler';
import { ShipmentStatusUpdatedEventHandler } from './application/events/handlers/shipment-status-updated.handler';

// Presentation Layer
import { ShipmentController } from './presentation/controllers/shipment.controller';
import { GateController } from './presentation/controllers/gate.controller';
import { TrackingEventController } from './presentation/controllers/tracking-event.controller';

/**
 * LogisticsModule - Lojistik kontrol simülasyon sistemi ana modülü
 * 
 * Bu modül aşağıdaki katmanları organize eder:
 * - Domain Layer: Entity'ler, Value Object'ler, Domain Event'ler
 * - Application Layer: CQRS Command/Query Handler'lar, Application Service'ler
 * - Infrastructure Layer: Repository implementasyonları, Database konfigürasyonu
 * - Presentation Layer: REST API Controller'lar
 */
@Module({
    imports: [
        // Konfigürasyon modülü - Environment variable'ları yönetir
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // TypeORM - Database bağlantısı ve ORM konfigürasyonu
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: createTypeOrmConfig,
        }),

        // Entity'leri bu modülde kullanmak için register et
        TypeOrmModule.forFeature([Shipment, TrackingEvent, Gate, OutboxEvent]),

        // CQRS modülü - Command ve Query pattern'lerini destekler
        CqrsModule,

        // Event Emitter - Domain event'leri yönetir
        EventEmitterModule.forRoot({
            wildcard: false,
            delimiter: '.',
            newListener: false,
            removeListener: false,
            maxListeners: 10,
            verboseMemoryLeak: false,
            ignoreErrors: false,
        }),

        // Schedule modülü - Cron job'lar için (şimdilik devre dışı)
        // ScheduleModule.forRoot(),
    ],

    controllers: [
        // REST API endpoint'lerini sağlayan controller'lar
        ShipmentController,
        GateController,
        TrackingEventController,
    ],

    providers: [
        // Infrastructure Services
        RedisService,
        OutboxService,

        // Repository implementations - Dependency Injection için
        TypeOrmShipmentRepository,
        TypeOrmOutboxEventRepository,

        // CQRS Command Handlers
        CreateShipmentHandler,

        // CQRS Query Handlers  
        GetShipmentByTrackingHandler,

        // Domain Event Handlers
        ShipmentCreatedEventHandler,
        ShipmentStatusUpdatedEventHandler,
    ],

    exports: [
        // Diğer modüllerin kullanabileceği service'ler
        TypeOrmShipmentRepository,
        TypeOrmOutboxEventRepository,
        RedisService,
        OutboxService,
        TypeOrmModule,
    ],
})
export class LogisticsModule { } 