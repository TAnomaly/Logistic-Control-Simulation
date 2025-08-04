import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Domain Entities
import { Driver } from './domain/entities/driver.entity';
import { DriverLocation } from './domain/entities/driver-location.entity';
import { DriverAssignment } from './domain/entities/driver-assignment.entity';
import { Shipment } from './domain/entities/shipment.entity';
import { DriverRoute } from './domain/entities/driver-route.entity';
import { OutboxEvent } from './domain/entities/outbox-event.entity';

// Infrastructure Repositories
import { TypeOrmDriverRepository } from './infrastructure/repositories/typeorm-driver.repository';
import { TypeOrmDriverLocationRepository } from './infrastructure/repositories/typeorm-driver-location.repository';
import { TypeOrmDriverAssignmentRepository } from './infrastructure/repositories/typeorm-driver-assignment.repository';
import { TypeOrmShipmentRepository } from './infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmDriverRouteRepository } from './infrastructure/repositories/typeorm-driver-route.repository';
import { TypeOrmOutboxEventRepository } from './infrastructure/repositories/typeorm-outbox-event.repository';
import { OutboxProcessorService } from './infrastructure/outbox/outbox-processor.service';

// Application Handlers
import { CreateDriverHandler } from './application/handlers/create-driver.handler';
import { UpdateDriverLocationHandler } from './application/handlers/update-driver-location.handler';
import { GetDriversHandler } from './application/handlers/get-drivers.handler';
import { GetDriverShipmentsHandler } from './application/handlers/get-driver-shipments.handler';
import { AssignShipmentHandler } from './application/handlers/assign-shipment.handler';

// Controllers
import { DriverController } from './controllers/driver.controller';
import { RouteController } from './controllers/route.controller';

// Infrastructure Services
import { RedisService } from './infrastructure/redis/redis.service';
import { RabbitMQService } from './infrastructure/rabbitmq/rabbitmq.service';

// Services
import { CapacityService } from './services/capacity.service';
import { RouteService } from './services/route.service';

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
            database: process.env.DB_NAME || 'driver_db',
            entities: [Driver, DriverLocation, DriverAssignment, Shipment, DriverRoute, OutboxEvent],
            synchronize: true, // Development only
            logging: true,
        }),
        TypeOrmModule.forFeature([Driver, DriverLocation, DriverAssignment, Shipment, DriverRoute, OutboxEvent]),
        CqrsModule,
        AuthModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-super-secret-key-here',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
        }),
    ],
    controllers: [DriverController, RouteController],
    providers: [
        // Repository Implementations
        TypeOrmDriverRepository,
        TypeOrmDriverLocationRepository,
        TypeOrmDriverAssignmentRepository,
        TypeOrmShipmentRepository,
        TypeOrmDriverRouteRepository,
        TypeOrmOutboxEventRepository,
        OutboxProcessorService,
        // Command Handlers
        CreateDriverHandler,
        UpdateDriverLocationHandler,
        AssignShipmentHandler,
        // Query Handlers
        GetDriversHandler,
        GetDriverShipmentsHandler,
        // Infrastructure Services
        RedisService,
        RabbitMQService,
        // Services
        CapacityService,
        RouteService,
    ],
})
export class DriverModule { } 