import { Controller, Get, Post, Put, Body, Param, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { EnhancedRouteService } from '../services/enhanced-route.service';

export interface OptimizeRouteRequest {
    driverId: string;
    shipmentIds: string[];
    // currentLocation is now fetched from driver_locations table automatically
}

export interface LocationUpdateRequest {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
}

export interface RouteResponse {
    success: boolean;
    message: string;
    data?: {
        routeId: string;
        driverId: string;
        polyline: string;
        waypoints: Array<any>;
        totalDistance: number;
        totalTime: number;
        optimizedOrder: string[];
        status: string;
        startLocation: {
            latitude: number;
            longitude: number;
            timestamp: Date;
        };
        routeReoptimized?: boolean;
    };
    error?: string;
}

@Controller('api/enhanced-routes')
export class EnhancedRouteController {
    private readonly logger = new Logger(EnhancedRouteController.name);

    constructor(
        private readonly enhancedRouteService: EnhancedRouteService
    ) { }

    @Post('optimize')
    async optimizeRoute(@Body() request: OptimizeRouteRequest): Promise<RouteResponse> {
        try {
            this.logger.log(`Optimizing route for driver ${request.driverId} with ${request.shipmentIds.length} shipments`);

            // Enhanced route optimization starts from driver's current location
            const optimizedRoute = await this.enhancedRouteService.optimizeRouteFromCurrentLocation(
                request.driverId,
                request.shipmentIds
            );

            return {
                success: true,
                message: 'Route optimized successfully from driver current location',
                data: {
                    routeId: optimizedRoute.id,
                    driverId: optimizedRoute.driverId,
                    polyline: '', // Will be populated from route geometry
                    waypoints: optimizedRoute.waypoints,
                    totalDistance: optimizedRoute.totalDistance,
                    totalTime: optimizedRoute.totalTime,
                    optimizedOrder: optimizedRoute.optimizedOrder,
                    status: optimizedRoute.status,
                    startLocation: {
                        latitude: optimizedRoute.startLatitude,
                        longitude: optimizedRoute.startLongitude,
                        timestamp: optimizedRoute.startLocationTimestamp
                    }
                }
            };
        } catch (error) {
            this.logger.error(`Route optimization failed: ${error.message}`, error.stack);
            throw new HttpException(
                error.message || 'Route optimization failed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('driver/:driverId/location')
    async updateDriverLocation(
        @Param('driverId') driverId: string,
        @Body() locationUpdate: LocationUpdateRequest
    ): Promise<RouteResponse> {
        try {
            this.logger.log(`Updating location for driver ${driverId}: ${locationUpdate.latitude}, ${locationUpdate.longitude}`);

            const result = await this.enhancedRouteService.updateDriverLocationAndOptimizeIfNeeded(
                driverId,
                locationUpdate.latitude,
                locationUpdate.longitude
            );

            if (result.routeReoptimized && result.newRoute) {
                return {
                    success: true,
                    message: 'Location updated and route re-optimized due to significant movement',
                    data: {
                        routeId: result.newRoute.id,
                        driverId: result.newRoute.driverId,
                        polyline: '',
                        waypoints: result.newRoute.waypoints,
                        totalDistance: result.newRoute.totalDistance,
                        totalTime: result.newRoute.totalTime,
                        optimizedOrder: result.newRoute.optimizedOrder,
                        status: result.newRoute.status,
                        startLocation: {
                            latitude: result.newRoute.startLatitude,
                            longitude: result.newRoute.startLongitude,
                            timestamp: result.newRoute.startLocationTimestamp
                        },
                        routeReoptimized: true
                    }
                };
            } else {
                return {
                    success: true,
                    message: 'Location updated successfully',
                    data: {
                        routeId: '',
                        driverId: driverId,
                        polyline: '',
                        waypoints: [],
                        totalDistance: 0,
                        totalTime: 0,
                        optimizedOrder: [],
                        status: 'location_updated',
                        startLocation: {
                            latitude: locationUpdate.latitude,
                            longitude: locationUpdate.longitude,
                            timestamp: new Date()
                        },
                        routeReoptimized: false
                    }
                };
            }
        } catch (error) {
            this.logger.error(`Failed to update driver location: ${error.message}`, error.stack);
            throw new HttpException(
                error.message || 'Failed to update driver location',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('driver/:driverId/current-location')
    async getDriverCurrentLocation(@Param('driverId') driverId: string): Promise<any> {
        try {
            const currentLocation = await this.enhancedRouteService.getDriverCurrentLocation(driverId);

            if (!currentLocation) {
                return {
                    success: false,
                    message: 'Driver location not found'
                };
            }

            return {
                success: true,
                message: 'Driver current location retrieved',
                data: {
                    driverId: currentLocation.driverId,
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    recordedAt: currentLocation.recordedAt,
                    speed: currentLocation.speed,
                    heading: currentLocation.heading
                }
            };
        } catch (error) {
            this.logger.error(`Failed to get driver current location: ${error.message}`, error.stack);
            throw new HttpException(
                'Failed to get driver current location',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('test/polyline-demo')
    async testPolylineGeneration(): Promise<any> {
        try {
            // Demo route from Istanbul to Ankara
            const demoRoute = await this.enhancedRouteService.optimizeRouteFromCurrentLocation(
                'demo-driver',
                ['demo-shipment-1', 'demo-shipment-2']
            );

            return {
                success: true,
                message: 'Demo polyline generated successfully',
                data: {
                    routeId: demoRoute.id,
                    startLocation: {
                        latitude: demoRoute.startLatitude,
                        longitude: demoRoute.startLongitude
                    },
                    waypoints: demoRoute.waypoints,
                    totalDistance: `${(demoRoute.totalDistance / 1000).toFixed(2)} km`,
                    totalTime: `${Math.round(demoRoute.totalTime / 60)} minutes`,
                    optimizedOrder: demoRoute.optimizedOrder,
                    professionalPolylineStorage: 'Using optimized table structure with encoded polylines'
                }
            };
        } catch (error) {
            this.logger.error(`Demo polyline generation failed: ${error.message}`, error.stack);
            throw new HttpException(
                'Demo polyline generation failed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
