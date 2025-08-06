import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';

// Domain Entities
import { DriverRoute } from './domain/entities/driver-route.entity';
import { Shipment } from './domain/entities/shipment.entity';
import { DriverAssignment } from './domain/entities/driver-assignment.entity';

// Infrastructure Repositories
import { TypeOrmDriverRouteRepository } from './infrastructure/repositories/typeorm-driver-route.repository';

// Services
import { H3RouteService } from './services/h3-route.service';
import { RouteOptimizationService } from './services/route-optimization.service';
import { DriverTrackingService } from './infrastructure/services/driver-tracking.service';

// Controllers
import { TrackingController } from './controllers/tracking.controller';
import { RouteController } from './controllers/route.controller';
import { RouteOptimizationController } from './controllers/route-optimization.controller';

// Gateways
import { TrackingGateway } from './gateways/tracking.gateway';

// Application Handlers
import { UpdateDriverLocationHandler } from './application/handlers/update-driver-location.handler';

const CommandHandlers = [UpdateDriverLocationHandler];

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'postgres',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: 'driver_db',
            entities: [DriverRoute, Shipment, DriverAssignment], // Tüm entity'leri geri ekliyorum
            synchronize: false, // Migration hatalarını önlemek için false
            logging: process.env.NODE_ENV === 'development',
        }),
        TypeOrmModule.forFeature([DriverRoute, Shipment, DriverAssignment]), // Tüm entity'leri geri ekliyorum
        CqrsModule.forRoot(),
    ],
    controllers: [
        TrackingController,
        RouteController,
        RouteOptimizationController
    ],
    providers: [
        // Command and Query Handlers
        ...CommandHandlers,

        // Services
        H3RouteService,
        RouteOptimizationService,
        DriverTrackingService,

        // Repositories
        TypeOrmDriverRouteRepository,
        {
            provide: 'DriverTrackingRepository',
            useClass: DriverTrackingService,
        },

        // Gateways
        TrackingGateway,
    ],
    exports: [
        H3RouteService,
        RouteOptimizationService,
        TypeOrmDriverRouteRepository,
    ],
})
export class TrackingModule { } 