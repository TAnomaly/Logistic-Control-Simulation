import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Domain Entities
import { Shipment } from './domain/entities/shipment.entity';
import { TrackingEvent } from './domain/entities/tracking-event.entity';
import { OutboxEvent } from './domain/entities/outbox-event.entity';

// Infrastructure Repositories
import { TypeOrmShipmentRepository } from './infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmTrackingEventRepository } from './infrastructure/repositories/typeorm-tracking-event.repository';
import { TypeOrmOutboxEventRepository } from './infrastructure/repositories/typeorm-outbox-event.repository';
import { OutboxProcessorService } from './infrastructure/outbox/outbox-processor.service';

// Application Handlers
import { CreateShipmentHandler } from './application/handlers/create-shipment.handler';
import { AssignShipmentHandler } from './application/handlers/assign-shipment.handler';
import { GetShipmentsHandler } from './application/handlers/get-shipments.handler';
import { GetShipmentByIdHandler } from './application/handlers/get-shipment-by-id.handler';

// Controllers
import { ShipmentController } from './controllers/shipment.controller';

// Infrastructure Services
import { RedisService } from './infrastructure/redis/redis.service';
import { RabbitMQService } from './infrastructure/rabbitmq/rabbitmq.service';

// Auth Module
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'postgres',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'planner_db',
            entities: [Shipment, TrackingEvent, OutboxEvent],
            synchronize: true, // Development only
            logging: true,
        }),
        TypeOrmModule.forFeature([Shipment, TrackingEvent, OutboxEvent]),
        CqrsModule,
        AuthModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-super-secret-key-here',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
        }),
    ],
    controllers: [ShipmentController],
    providers: [
        // Repository Implementations
        TypeOrmShipmentRepository,
        TypeOrmTrackingEventRepository,
        TypeOrmOutboxEventRepository,
        OutboxProcessorService,
        // Command Handlers
        CreateShipmentHandler,
        AssignShipmentHandler,
        // Query Handlers
        GetShipmentsHandler,
        GetShipmentByIdHandler,
        // Infrastructure Services
        RedisService,
        RabbitMQService,
    ],
})
export class PlannerModule { } 