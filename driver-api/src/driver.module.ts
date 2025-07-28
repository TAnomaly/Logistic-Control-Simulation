import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Domain Entities
import { Driver } from './domain/entities/driver.entity';
import { DriverLocation } from './domain/entities/driver-location.entity';
import { DriverAssignment } from './domain/entities/driver-assignment.entity';

// Infrastructure Repositories
import { TypeOrmDriverRepository } from './infrastructure/repositories/typeorm-driver.repository';
import { TypeOrmDriverLocationRepository } from './infrastructure/repositories/typeorm-driver-location.repository';
import { TypeOrmDriverAssignmentRepository } from './infrastructure/repositories/typeorm-driver-assignment.repository';

// Application Handlers
import { CreateDriverHandler } from './application/handlers/create-driver.handler';
import { UpdateDriverLocationHandler } from './application/handlers/update-driver-location.handler';
import { GetDriversHandler } from './application/handlers/get-drivers.handler';
import { AssignShipmentHandler } from './application/handlers/assign-shipment.handler';

// Controllers
import { DriverController } from './controllers/driver.controller';

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
            database: process.env.DB_NAME || 'driver_db',
            entities: [Driver, DriverLocation, DriverAssignment],
            synchronize: true, // Development only
            logging: true,
        }),
        TypeOrmModule.forFeature([Driver, DriverLocation, DriverAssignment]),
        CqrsModule,
        AuthModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-super-secret-key-here',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
        }),
    ],
    controllers: [DriverController],
    providers: [
        // Repository Implementations
        TypeOrmDriverRepository,
        TypeOrmDriverLocationRepository,
        TypeOrmDriverAssignmentRepository,
        // Command Handlers
        CreateDriverHandler,
        UpdateDriverLocationHandler,
        AssignShipmentHandler,
        // Query Handlers
        GetDriversHandler,
        // Infrastructure Services
        RedisService,
        RabbitMQService,
    ],
})
export class DriverModule { } 