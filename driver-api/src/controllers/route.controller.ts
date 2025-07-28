import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TypeOrmDriverRouteRepository } from '../infrastructure/repositories/typeorm-driver-route.repository';
import { RouteStatus } from '../domain/entities/driver-route.entity';
import { UserRole } from '../auth/jwt.strategy';

@Controller('routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RouteController {
    constructor(
        private readonly routeRepository: TypeOrmDriverRouteRepository
    ) { }

    @Get('driver/:driverId/active')
    @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.DISPATCHER)
    async getActiveRoute(@Param('driverId') driverId: string, @Request() req: any) {
        // Check if driver is requesting their own route or admin/planner is requesting
        if (req.user.role === 'driver' && req.user.driverId !== driverId) {
            throw new Error('Unauthorized: Driver can only access their own routes');
        }

        const activeRoute = await this.routeRepository.findActiveRouteByDriverId(driverId);

        if (!activeRoute) {
            return {
                message: 'No active route found for this driver',
                route: null
            };
        }

        return {
            message: 'Active route retrieved successfully',
            route: activeRoute
        };
    }

    @Get('driver/:driverId/history')
    @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.DISPATCHER)
    async getRouteHistory(@Param('driverId') driverId: string, @Request() req: any) {
        // Check if driver is requesting their own routes or admin/planner is requesting
        if (req.user.role === 'driver' && req.user.driverId !== driverId) {
            throw new Error('Unauthorized: Driver can only access their own routes');
        }

        const routes = await this.routeRepository.findByDriverId(driverId);

        return {
            message: 'Route history retrieved successfully',
            routes: routes
        };
    }

    @Post('driver/:driverId/save')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    async saveRoute(
        @Param('driverId') driverId: string,
        @Body() routeData: {
            optimizedRoute: any;
            totalDistance: number;
            totalTime: number;
            fuelEstimate: number;
            efficiency: number;
        }
    ) {
        // First, complete any existing active route
        const existingActiveRoute = await this.routeRepository.findActiveRouteByDriverId(driverId);
        if (existingActiveRoute) {
            await this.routeRepository.updateStatus(existingActiveRoute.id, RouteStatus.COMPLETED);
        }

        // Create new route
        const newRoute = await this.routeRepository.save({
            driverId,
            ...routeData,
            status: RouteStatus.PLANNED,
            completedDeliveries: 0
        } as any);

        return {
            message: 'Route saved successfully',
            route: newRoute
        };
    }

    @Put(':routeId/start')
    @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.DISPATCHER)
    async startRoute(@Param('routeId') routeId: string, @Request() req: any) {
        const route = await this.routeRepository.findById(routeId);

        if (!route) {
            throw new Error('Route not found');
        }

        // Check if driver is starting their own route or admin/planner is starting
        if (req.user.role === 'driver' && req.user.driverId !== route.driverId) {
            throw new Error('Unauthorized: Driver can only start their own routes');
        }

        await this.routeRepository.startRoute(routeId);

        return {
            message: 'Route started successfully'
        };
    }

    @Put(':routeId/complete')
    @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.DISPATCHER)
    async completeRoute(@Param('routeId') routeId: string, @Request() req: any) {
        const route = await this.routeRepository.findById(routeId);

        if (!route) {
            throw new Error('Route not found');
        }

        // Check if driver is completing their own route or admin/planner is completing
        if (req.user.role === 'driver' && req.user.driverId !== route.driverId) {
            throw new Error('Unauthorized: Driver can only complete their own routes');
        }

        await this.routeRepository.completeRoute(routeId);

        return {
            message: 'Route completed successfully'
        };
    }

    @Put(':routeId/update-location')
    @Roles(UserRole.DRIVER)
    async updateRouteLocation(
        @Param('routeId') routeId: string,
        @Body() locationData: { latitude: number; longitude: number; address: string },
        @Request() req: any
    ) {
        const route = await this.routeRepository.findById(routeId);

        if (!route) {
            throw new Error('Route not found');
        }

        // Check if driver is updating their own route
        if (req.user.driverId !== route.driverId) {
            throw new Error('Unauthorized: Driver can only update their own routes');
        }

        await this.routeRepository.updateCurrentLocation(
            routeId,
            locationData.latitude,
            locationData.longitude,
            locationData.address
        );

        return {
            message: 'Route location updated successfully'
        };
    }

    @Put(':routeId/delivery-completed')
    @Roles(UserRole.DRIVER)
    async markDeliveryCompleted(@Param('routeId') routeId: string, @Request() req: any) {
        const route = await this.routeRepository.findById(routeId);

        if (!route) {
            throw new Error('Route not found');
        }

        // Check if driver is updating their own route
        if (req.user.driverId !== route.driverId) {
            throw new Error('Unauthorized: Driver can only update their own routes');
        }

        await this.routeRepository.incrementCompletedDeliveries(routeId);

        return {
            message: 'Delivery marked as completed'
        };
    }
} 