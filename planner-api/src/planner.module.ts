import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Domain Entities
import { Shipment } from './domain/entities/shipment.entity';
import { OutboxEvent } from './domain/entities/outbox-event.entity';
import { TrackingEvent } from './domain/entities/tracking-event.entity';

// Infrastructure Repositories
import { TypeOrmShipmentRepository } from './infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmOutboxEventRepository } from './infrastructure/repositories/typeorm-outbox-event.repository';
import { TypeOrmTrackingEventRepository } from './infrastructure/repositories/typeorm-tracking-event.repository';

// Application Commands
import { CreateShipmentCommand } from './application/commands/create-shipment.command';
import { AssignShipmentCommand } from './application/commands/assign-shipment.command';

// Application Queries
import { GetShipmentsQuery } from './application/queries/get-shipments.query';
import { GetShipmentByIdQuery } from './application/queries/get-shipment-by-id.query';

// Application Handlers
import { CreateShipmentHandler } from './application/handlers/create-shipment.handler';
import { AssignShipmentHandler } from './application/handlers/assign-shipment.handler';
import { GetShipmentsHandler } from './application/handlers/get-shipments.handler';
import { GetShipmentByIdHandler } from './application/handlers/get-shipment-by-id.handler';

// Infrastructure Services
import { OutboxProcessorService } from './infrastructure/outbox/outbox-processor.service';
import { RabbitMQService } from './infrastructure/rabbitmq/rabbitmq.service';
import { RedisService } from './infrastructure/redis/redis.service';

// Common Services
import { CustomLogger } from './common/logger/logger.service';

// Controllers
import { ShipmentController } from './controllers/shipment.controller';
import { AuthController } from './auth/auth.controller';
import { HealthController } from './common/health/health.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';

// Guards
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

const CommandHandlers = [
    CreateShipmentHandler,
    AssignShipmentHandler,
];

const QueryHandlers = [
    GetShipmentsHandler,
    GetShipmentByIdHandler,
];

const EventHandlers: any[] = [];

@Module({
    imports: [
        ConfigModule.forRoot(),
        // TypeORM configuration removed for now
        CqrsModule.forRoot(),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    controllers: [
        ShipmentController,
        AuthController,
        HealthController,
    ],
    providers: [
        // Common Services
        CustomLogger,

        // Repositories
        TypeOrmShipmentRepository,
        TypeOrmOutboxEventRepository,
        TypeOrmTrackingEventRepository,

        // Services
        OutboxProcessorService,
        RabbitMQService,
        RedisService,
        AuthService,
        JwtStrategy,

        // Guards
        JwtAuthGuard,
        RolesGuard,

        // Command and Query Handlers
        ...CommandHandlers,
        ...QueryHandlers,
        ...EventHandlers,
    ],
    exports: [
        // Common Services
        CustomLogger,

        // Repositories
        TypeOrmShipmentRepository,
        TypeOrmOutboxEventRepository,
        TypeOrmTrackingEventRepository,

        // Services
        OutboxProcessorService,
        RabbitMQService,
        RedisService,
    ],
})
export class PlannerModule { } 