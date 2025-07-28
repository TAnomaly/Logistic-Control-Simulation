import { Injectable } from '@nestjs/common';
import { TypeOrmDriverRouteRepository } from '../infrastructure/repositories/typeorm-driver-route.repository';
import { DriverRoute, RouteStatus } from '../domain/entities/driver-route.entity';
import { TypeOrmDriverRepository } from '../infrastructure/repositories/typeorm-driver.repository';

@Injectable()
export class RouteService {
    constructor(
        private readonly routeRepository: TypeOrmDriverRouteRepository,
        private readonly driverRepository: TypeOrmDriverRepository
    ) { }

    async saveOptimizedRoute(
        driverId: string,
        optimizedRouteData: any,
        totalDistance: number,
        totalTime: number,
        fuelEstimate: number,
        efficiency: number
    ): Promise<DriverRoute> {
        // Check if driver exists
        const driver = await this.driverRepository.findById(driverId);
        if (!driver) {
            throw new Error('Driver not found');
        }

        // Create new route
        const route = new DriverRoute();
        route.driverId = driverId;
        route.optimizedRoute = optimizedRouteData;
        route.totalDistance = totalDistance;
        route.totalTime = totalTime;
        route.fuelEstimate = fuelEstimate;
        route.efficiency = efficiency;
        route.status = RouteStatus.PLANNED;
        route.completedDeliveries = 0;

        // Set current location from driver
        if (driver.currentLocation) {
            route.currentLocation = driver.currentLocation;
        }

        return await this.routeRepository.save(route);
    }

    async getDriverRoutes(driverId: string): Promise<DriverRoute[]> {
        return await this.routeRepository.findByDriverId(driverId);
    }

    async getActiveRoute(driverId: string): Promise<DriverRoute | null> {
        return await this.routeRepository.findActiveRouteByDriverId(driverId);
    }

    async startRoute(routeId: string): Promise<void> {
        await this.routeRepository.startRoute(routeId);
    }

    async completeRoute(routeId: string): Promise<void> {
        await this.routeRepository.completeRoute(routeId);
    }

    async updateRouteLocation(
        routeId: string,
        latitude: number,
        longitude: number,
        address: string
    ): Promise<void> {
        await this.routeRepository.updateCurrentLocation(routeId, latitude, longitude, address);
    }

    async markDeliveryCompleted(routeId: string): Promise<void> {
        await this.routeRepository.incrementCompletedDeliveries(routeId);
    }

    async getRouteProgress(routeId: string): Promise<{
        completed: number;
        total: number;
        percentage: number;
    }> {
        const route = await this.routeRepository.findById(routeId);
        if (!route) {
            throw new Error('Route not found');
        }

        const totalDeliveries = route.optimizedRoute.optimized_route?.length || 0;
        const completed = route.completedDeliveries;
        const percentage = totalDeliveries > 0 ? (completed / totalDeliveries) * 100 : 0;

        return {
            completed,
            total: totalDeliveries,
            percentage: Math.round(percentage)
        };
    }
} 