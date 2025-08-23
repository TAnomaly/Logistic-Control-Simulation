import { Controller, Get, Post, Body, Param, Render, Logger } from '@nestjs/common';
import { H3RouteService } from '../services/h3-route.service';

@Controller()
export class TrackingController {
    private readonly logger = new Logger(TrackingController.name);

    constructor(
        private readonly h3RouteService: H3RouteService
    ) { }

    @Get()
    @Render('dashboard')
    async getDashboard() {
        try {
            // Get all driver routes for dashboard
            const routes = await this.h3RouteService.getAllRoutes();
            return {
                title: 'Logistics Control Dashboard',
                routes: routes || []
            };
        } catch (error) {
            this.logger.error(`Dashboard error: ${error.message}`, error.stack);
            return {
                title: 'Logistics Control Dashboard',
                routes: [],
                error: 'Failed to load routes'
            };
        }
    }

    @Get('health')
    healthCheck() {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'tracking-service'
        };
    }

    @Post('location/:driverId')
    async updateDriverLocation(
        @Param('driverId') driverId: string,
        @Body() locationData: { latitude: number; longitude: number; timestamp?: string }
    ) {
        try {
            this.logger.log(`Updating location for driver ${driverId}: ${locationData.latitude}, ${locationData.longitude}`);

            // Here you would update the driver's location in the database
            // For now, just return success
            return {
                success: true,
                message: 'Location updated successfully',
                driverId,
                location: locationData
            };
        } catch (error) {
            this.logger.error(`Failed to update location: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Failed to update location',
                error: error.message
            };
        }
    }

        @Get('database/driver-location/:driverId')
    async getDriverLocation(@Param('driverId') driverId: string) {
        try {
            this.logger.log(`Getting location for driver ${driverId}`);
            
            // Mock response with Mirac's Istanbul location
            const mockLocation = {
                driverId: driverId,
                latitude: 41.0082,
                longitude: 28.9784,
                address: 'Eminönü, İstanbul, Turkey',
                recordedAt: new Date().toISOString(),
                speed: 0,
                accuracy: 10
            };

            return { 
                success: true, 
                message: 'Driver location retrieved successfully',
                data: mockLocation
            };
        } catch (error) {
            this.logger.error(`Failed to get location: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Failed to get driver location',
                error: error.message
            };
        }
    }

    @Get('database/driver-route/:driverId')
    async getDriverRoute(@Param('driverId') driverId: string) {
        try {
            this.logger.log(`Getting route for driver ${driverId}`);
            
            // Database'den route çek - mock query response
            const mockRouteFromDB = {
                driverId: driverId,
                optimizedRoute: {
                    polyline: 'u{~vFsurqB_n@_n@_n@_n@_n@_n@',
                    waypoints: [
                        { latitude: 41.0082, longitude: 28.9784, type: 'start', city: 'İstanbul' },
                        { latitude: 40.1826, longitude: 29.0669, type: 'delivery', city: 'Bursa' },
                        { latitude: 39.9334, longitude: 32.8597, type: 'delivery', city: 'Ankara' },
                        { latitude: 37.3212, longitude: 40.7245, type: 'delivery', city: 'Mardin' }
                    ],
                    optimizedOrder: ['İstanbul', 'Bursa', 'Ankara', 'Mardin']
                },
                totalDistance: 1350000, // meters
                totalTime: 960, // minutes
                fuelEstimate: 108.0,
                efficiency: 85.5,
                status: 'planned'
            };

            return { 
                success: true, 
                message: 'Driver route retrieved successfully',
                data: mockRouteFromDB
            };
        } catch (error) {
            this.logger.error(`Failed to get route: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Failed to get driver route',
                error: error.message
            };
        }
    }
}
