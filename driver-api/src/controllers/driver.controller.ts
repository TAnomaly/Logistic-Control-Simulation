import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDriverCommand } from '../application/commands/create-driver.command';
import { UpdateDriverLocationCommand } from '../application/commands/update-driver-location.command';
import { GetDriversQuery } from '../application/queries/get-drivers.query';
import { GetDriverShipmentsQuery } from '../application/queries/get-driver-shipments.query';
import { Driver, DriverStatus } from '../domain/entities/driver.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/jwt.strategy';
import { CapacityService } from '../services/capacity.service';
import { RouteService } from '../services/route.service';

export class CreateDriverDto {
    name: string;
    licenseNumber: string;
    phoneNumber: string;
    address?: string;
}

export class UpdateLocationDto {
    latitude: number;
    longitude: number;
    address?: string;
    speed?: number;
    heading?: number;
}

@Controller('drivers')
export class DriverController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly capacityService: CapacityService,
        private readonly routeService: RouteService
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
    ): Promise<Driver> {
        const command = new UpdateDriverLocationCommand(
            id,
            dto.latitude,
            dto.longitude,
            dto.address,
            dto.speed,
            dto.heading
        );

        return await this.commandBus.execute(command);
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