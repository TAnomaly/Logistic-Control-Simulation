import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Domain Entities
import { Driver } from './domain/entities/driver.entity';
import { DriverLocation } from './domain/entities/driver-location.entity';
import { DriverAssignment } from './domain/entities/driver-assignment.entity';
import { Shipment } from './domain/entities/shipment.entity';
import { DriverRoute } from './domain/entities/driver-route.entity';
import { OutboxEvent } from './domain/entities/outbox-event.entity';

// Shared Entities
// import { OptimizedRoute } from '../../shared/entities/optimized-route.entity';
// import { RouteGeometry } from '../../shared/entities/route-geometry.entity';

// Infrastructure Repositories
import { TypeOrmDriverRepository } from './infrastructure/repositories/typeorm-driver.repository';
import { TypeOrmDriverLocationRepository } from './infrastructure/repositories/typeorm-driver-location.repository';
import { TypeOrmDriverAssignmentRepository } from './infrastructure/repositories/typeorm-driver-assignment.repository';
import { TypeOrmShipmentRepository } from './infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmDriverRouteRepository } from './infrastructure/repositories/typeorm-driver-route.repository';
import { TypeOrmOutboxEventRepository } from './infrastructure/repositories/typeorm-outbox-event.repository';

// Application Commands
import { CreateDriverCommand } from './application/commands/create-driver.command';
import { UpdateDriverLocationCommand } from './application/commands/update-driver-location.command';
import { AssignShipmentCommand } from './application/commands/assign-shipment.command';

// Application Queries
import { GetDriversQuery } from './application/queries/get-drivers.query';
import { GetDriverShipmentsQuery } from './application/queries/get-driver-shipments.query';
import { GetDriverByIdQuery } from './application/queries/get-driver-by-id.query';

// Application Handlers
import { CreateDriverHandler } from './application/handlers/create-driver.handler';
import { UpdateDriverLocationHandler } from './application/handlers/update-driver-location.handler';
import { AssignShipmentHandler } from './application/handlers/assign-shipment.handler';
import { GetDriversHandler } from './application/handlers/get-drivers.handler';
import { GetDriverShipmentsHandler } from './application/handlers/get-driver-shipments.handler';
import { GetDriverByIdHandler } from './application/handlers/get-driver-by-id.handler';

// Infrastructure Services
import { OutboxProcessorService } from './infrastructure/outbox/outbox-processor.service';
import { RabbitMQService } from './infrastructure/rabbitmq/rabbitmq.service';
import { RedisService } from './infrastructure/redis/redis.service';
// import { EnhancedRedisService } from '../../shared/infrastructure/enhanced-redis.service';
// import { EnhancedOutboxProcessorService } from '../../shared/outbox/enhanced-outbox-processor.service';
// import { GeometryService } from '../../shared/services/geometry.service';

// Common Services
import { CustomLogger } from './common/logger/logger.service';
import { RouteService } from './services/route.service';
import { CapacityService } from './services/capacity.service';
import { DriverService } from './services/driver.service';
// import { LocationService } from './services/location.service';
// import { GeofencingService } from './services/geofencing.service';

// Controllers
import { DriverController } from './controllers/driver.controller';
import { RouteController } from './controllers/route.controller';
// import { LocationController } from './controllers/location.controller';
import { AuthController } from './auth/auth.controller';
import { HealthController } from './common/health/health.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';

// Guards
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

const CommandHandlers = [
    CreateDriverHandler,
    UpdateDriverLocationHandler,
    AssignShipmentHandler,
];

const QueryHandlers = [
    GetDriversHandler,
    GetDriverShipmentsHandler,
    GetDriverByIdHandler,
];

const EventHandlers: any[] = [];

@Module({
    imports: [
        ConfigModule.forRoot(),
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'postgres',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'driver_db',
            entities: [Driver, DriverLocation, DriverAssignment, Shipment, DriverRoute, OutboxEvent],
            synchronize: false,
            logging: process.env.NODE_ENV === 'development',
        }),
        TypeOrmModule.forFeature([Driver, DriverLocation, DriverAssignment, Shipment, DriverRoute, OutboxEvent]),
        CqrsModule.forRoot(),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    controllers: [
        DriverController,
        RouteController,
        // LocationController,
        AuthController,
        HealthController,
    ],
    providers: [
        // Common Services
        CustomLogger,

        // Repositories
        TypeOrmDriverRepository,
        TypeOrmDriverLocationRepository,
        TypeOrmDriverAssignmentRepository,
        TypeOrmShipmentRepository,
        TypeOrmDriverRouteRepository,
        TypeOrmOutboxEventRepository,

        // Services
        OutboxProcessorService,
        // EnhancedOutboxProcessorService,
        RabbitMQService,
        RedisService,
        // EnhancedRedisService,
        RouteService,
        CapacityService,
        DriverService,
        // LocationService,
        // GeofencingService,
        // GeometryService,
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
        TypeOrmDriverRepository,
        TypeOrmDriverLocationRepository,
        TypeOrmDriverAssignmentRepository,
        TypeOrmShipmentRepository,
        TypeOrmDriverRouteRepository,
        TypeOrmOutboxEventRepository,
        OutboxProcessorService,
        RabbitMQService,
        RedisService,
        RouteService,
        CapacityService,
    ],
})
export class DriverModule { } 