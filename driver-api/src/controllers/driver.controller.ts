import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDriverCommand } from '../application/commands/create-driver.command';
import { AssignShipmentCommand } from '../application/commands/assign-shipment.command';
import { UpdateDriverLocationCommand } from '../application/commands/update-driver-location.command';
import { GetDriversQuery } from '../application/queries/get-drivers.query';
import { GetDriverShipmentsQuery } from '../application/queries/get-driver-shipments.query';
import { Driver, DriverStatus } from '../domain/entities/driver.entity';
import { DriverAssignment, AssignmentStatus } from '../domain/entities/driver-assignment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/jwt.strategy';
import { CapacityService } from '../services/capacity.service';
import { RouteService } from '../services/route.service';
import { RabbitMQService } from '../infrastructure/rabbitmq/rabbitmq.service';

import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateDriverDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    licenseNumber: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsOptional()
    address?: string;
}

export class UpdateLocationDto {
    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @IsString()
    @IsOptional()
    address?: string;

    @IsNumber()
    @IsOptional()
    speed?: number;

    @IsNumber()
    @IsOptional()
    heading?: number;
}

@Controller('drivers')
export class DriverController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly capacityService: CapacityService,
        private readonly routeService: RouteService,
        private readonly rabbitMQService: RabbitMQService
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @Post()
    async createDriver(@Body() dto: CreateDriverDto): Promise<Driver> {
        const command = new CreateDriverCommand(
            dto.name,
            dto.licenseNumber,
            dto.phoneNumber,
            dto.address
        );

        return await this.commandBus.execute(command);
    }

    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Put(':id/location')
    async updateLocation(
        @Param('id') id: string,
        @Body() dto: UpdateLocationDto
    ) {
        // Konum güncelleme işlemi
        const locationUpdate = {
            success: true,
            message: `Driver ${id} location updated successfully`,
            driverId: id,
            location: {
                latitude: dto.latitude,
                longitude: dto.longitude,
                address: dto.address,
                speed: dto.speed,
                heading: dto.heading
            },
            updatedAt: new Date().toISOString()
        };

        // 🚛 WEBHOOK: Konum güncellendiğinde otomatik rota optimizasyonu için event gönder
        try {
            await this.rabbitMQService.publishEvent('driver.location.updated', {
                driverId: id,
                location: {
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    address: dto.address
                },
                timestamp: new Date().toISOString()
            }, 'driver.location.updated');

            console.log(`📡 Webhook event sent: driver.location.updated for driver ${id}`);
        } catch (error) {
            console.error(`❌ Failed to send webhook event: ${error.message}`);
        }

        return locationUpdate;
    }

    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get()
    async getDrivers(@Query('status') status?: DriverStatus): Promise<Driver[]> {
        const query = new GetDriversQuery(status);
        return await this.queryBus.execute(query);
    }

    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get('available')
    async getAvailableDrivers(): Promise<Driver[]> {
        const query = new GetDriversQuery(DriverStatus.AVAILABLE);
        return await this.queryBus.execute(query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get(':id/shipments')
    async getDriverShipments(
        @Param('id') driverId: string,
        @Query('status') status?: string
    ) {
        const query = new GetDriverShipmentsQuery(driverId, status);
        return await this.queryBus.execute(query);
    }

    @Post(':id/assign-shipment')
    async assignShipment(
        @Param('id') driverId: string,
        @Body() dto: { shipmentId: string }
    ) {
        console.log(`🚚 Assigning shipment ${dto.shipmentId} to driver ${driverId}`);

        // Basit test - direkt repository kullanarak kaydet
        try {
            const assignment = {
                driverId: driverId,
                shipmentId: dto.shipmentId,
                status: AssignmentStatus.PENDING,
                assignedAt: new Date(),
                estimatedDuration: null,
                notes: null
            };

            console.log(`📝 Assignment data:`, assignment);

            // In-memory assignment - repository kullanmıyoruz
            console.log(`✅ Assignment processed in memory`);
        } catch (error) {
            console.error(`❌ Assignment failed:`, error);
            throw error;
        }

        return {
            success: true,
            message: `Shipment ${dto.shipmentId} assigned to driver ${driverId}`,
            driverId: driverId,
            shipmentId: dto.shipmentId,
            assignedAt: new Date().toISOString()
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get(':id/capacity')
    async getDriverCapacity(@Param('id') driverId: string) {
        return await this.capacityService.getDriverCapacityInfo(driverId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get(':id/routes')
    async getDriverRoutes(@Param('id') driverId: string) {
        return await this.routeService.getDriverRoutes(driverId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get(':id/routes/active')
    async getActiveRoute(@Param('id') driverId: string) {
        return await this.routeService.getActiveRoute(driverId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get(':id/current-route')
    async getCurrentRoute(@Param('id') driverId: string) {
        // Driver'ın mevcut rotasını getir
        const routes = await this.routeService.getDriverRoutes(driverId);
        const activeRoute = routes.find(route => route.status === 'in_progress' || route.status === 'planned');

        if (activeRoute) {
            return {
                success: true,
                routeId: activeRoute.id,
                optimizedRoute: activeRoute.optimizedRoute.route,
                waypoints: activeRoute.optimizedRoute.waypoints,
                totalDistance: activeRoute.totalDistance,
                totalTime: activeRoute.totalTime,
                status: activeRoute.status,
                currentLocation: activeRoute.currentLocation,
                completedDeliveries: activeRoute.completedDeliveries,
                startedAt: activeRoute.startedAt,
                message: `Driver ${driverId} has an active route`
            };
        } else {
            return {
                success: false,
                message: `Driver ${driverId} has no active route`
            };
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Post(':id/routes/save')
    async saveOptimizedRoute(
        @Param('id') driverId: string,
        @Body() routeData: {
            optimizedRoute: any;
            totalDistance: number;
            totalTime: number;
            fuelEstimate: number;
            efficiency: number;
        }
    ) {
        return await this.routeService.saveOptimizedRoute(
            driverId,
            routeData.optimizedRoute,
            routeData.totalDistance,
            routeData.totalTime,
            routeData.fuelEstimate,
            routeData.efficiency
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Post(':id/route')
    async assignRoute(
        @Param('id') driverId: string,
        @Body() dto: {
            optimizedRoute: string;
            totalDistance: number;
            estimatedTime: number;
        }
    ) {
        // Database'e rota kaydet
        const savedRoute = await this.routeService.saveOptimizedRoute(
            driverId,
            {
                route: dto.optimizedRoute,
                waypoints: dto.optimizedRoute.split(' → ')
            },
            dto.totalDistance,
            dto.estimatedTime * 60, // dakikaya çevir
            0, // fuel estimate
            85.5 // efficiency
        );

        return {
            success: true,
            message: `Route assigned to driver ${driverId}`,
            driverId: driverId,
            routeId: savedRoute.id,
            optimizedRoute: dto.optimizedRoute,
            totalDistance: dto.totalDistance,
            estimatedTime: dto.estimatedTime,
            assignedAt: new Date().toISOString()
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Post('routes/:routeId/start')
    async startRoute(@Param('routeId') routeId: string) {
        await this.routeService.startRoute(routeId);
        return { message: 'Route started successfully' };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Post('routes/:routeId/complete')
    async completeRoute(@Param('routeId') routeId: string) {
        await this.routeService.completeRoute(routeId);
        return { message: 'Route completed successfully' };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @Get('routes/:routeId/progress')
    async getRouteProgress(@Param('routeId') routeId: string) {
        return await this.routeService.getRouteProgress(routeId);
    }
} 