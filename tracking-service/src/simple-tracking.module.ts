import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Domain entities
import { DriverRoute } from './domain/entities/driver-route.entity';
import { DriverAssignment } from './domain/entities/driver-assignment.entity';
import { Shipment } from './domain/entities/shipment.entity';

// Services
import { H3RouteService } from './services/h3-route.service';
import { EnhancedRouteService } from './services/enhanced-route.service';

// Controllers
import { RouteController } from './controllers/route.controller';
import { TrackingController } from './controllers/tracking.controller';
import { EnhancedRouteController } from './controllers/enhanced-route.controller';

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
            entities: [
                DriverRoute,
                DriverAssignment,
                Shipment
            ],
            synchronize: false,
            logging: process.env.NODE_ENV === 'development',
        }),
        TypeOrmModule.forFeature([
            DriverRoute,
            DriverAssignment,
            Shipment
        ])
    ],
    controllers: [
        RouteController,
        TrackingController,
        EnhancedRouteController
    ],
    providers: [
        H3RouteService,
        EnhancedRouteService
    ],
    exports: [
        H3RouteService,
        EnhancedRouteService
    ]
})
export class SimpleTrackingModule { }
