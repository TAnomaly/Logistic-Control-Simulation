import { Controller, Post, Body, Get, HttpException, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OptimizeRouteCommand } from '../application/commands/optimize-route.command';
import { OptimizeRouteH3Command } from '../application/commands/optimize-route-h3.command';
import { OptimizeRouteRequestDto, OptimizeRouteResponseDto } from '../dto/route-optimization.dto';
import { OptimizeRouteH3RequestDto, OptimizeRouteH3ResponseDto } from '../dto/h3-route-optimization.dto';
import { Coordinates, DeliveryPoint, PriorityEnum } from '../domain/entities/route-optimization.entity';
import { H3DeliveryPoint, TimeWindow } from '../domain/entities/h3-route.entity';
import { H3OptimizationAlgorithm } from '../domain/repositories/h3-route-optimization.repository';
import { latLngToCell } from 'h3-js';

@Controller()
export class RouteOptimizationController {
    constructor(private readonly commandBus: CommandBus) { }

    @Get('health')
    async healthCheck() {
        return {
            status: 'healthy',
            service: 'ML Route Optimization Service',
            timestamp: new Date().toISOString(),
            features: [
                'NestJS DDD Architecture',
                'CQRS Pattern',
                'Route Optimization Algorithm',
                'Haversine Distance Calculation',
                'Greedy TSP Algorithm',
                'Uber H3 Hexagonal Grid',
                'Traffic Analysis',
                'Weather Analysis',
                'Sustainability Scoring',
                'Multiple Optimization Algorithms'
            ],
            algorithms: {
                basic: 'Greedy TSP + Haversine',
                h3: ['greedy', '2-opt', 'genetic', 'ant_colony']
            }
        };
    }

    @Post('optimize-route')
    async optimizeRoute(@Body() request: OptimizeRouteRequestDto): Promise<OptimizeRouteResponseDto> {
        try {
            // Convert DTO to domain entities
            const driverLocation = new Coordinates(
                request.driverLocation.latitude,
                request.driverLocation.longitude
            );

            const deliveries = request.deliveries.map(delivery =>
                new DeliveryPoint(
                    delivery.id,
                    delivery.address,
                    new Coordinates(delivery.coordinates.latitude, delivery.coordinates.longitude),
                    delivery.priority as PriorityEnum || PriorityEnum.MEDIUM,
                    delivery.weight || 0,
                    delivery.volume || 0
                )
            );

            // Create and execute command
            const command = new OptimizeRouteCommand(
                request.driverId,
                driverLocation,
                deliveries,
                request.vehicleCapacity || 1000,
                request.vehicleVolume || 10
            );

            const result = await this.commandBus.execute(command);

            // Convert domain entity to response DTO
            return {
                driverId: result.driverId,
                optimizedRoute: result.optimizedRoute.map(point => ({
                    order: point.order,
                    deliveryId: point.deliveryId,
                    address: point.address,
                    coordinates: {
                        latitude: point.coordinates.latitude,
                        longitude: point.coordinates.longitude
                    },
                    distanceFromPrevious: point.distanceFromPrevious,
                    estimatedTime: point.estimatedTime,
                    cumulativeDistance: point.cumulativeDistance,
                    cumulativeTime: point.cumulativeTime
                })),
                totalDistance: result.totalDistance,
                totalTime: result.totalTime,
                fuelEstimate: result.fuelEstimate,
                efficiency: result.efficiency,
                algorithm: result.algorithm,
                message: result.message
            };
        } catch (error) {
            throw new HttpException(
                `Route optimization failed: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('optimize-route-h3')
    async optimizeRouteH3(@Body() request: OptimizeRouteH3RequestDto): Promise<OptimizeRouteH3ResponseDto> {
        try {
            // Convert DTO to domain entities
            const driverLocation = new Coordinates(
                request.driverLocation.latitude,
                request.driverLocation.longitude
            );

            const deliveries = request.deliveries.map(delivery => {
                const h3Index = latLngToCell(
                    delivery.coordinates.latitude,
                    delivery.coordinates.longitude,
                    request.h3Resolution || 9
                );

                const timeWindow = delivery.timeWindow ?
                    new TimeWindow(delivery.timeWindow.start, delivery.timeWindow.end) :
                    undefined;

                return new H3DeliveryPoint(
                    delivery.id,
                    delivery.address,
                    new Coordinates(delivery.coordinates.latitude, delivery.coordinates.longitude),
                    h3Index,
                    delivery.priority as PriorityEnum || PriorityEnum.MEDIUM,
                    delivery.weight || 0,
                    delivery.volume || 0,
                    timeWindow,
                    delivery.serviceTimeMin || 5,
                    delivery.specialRequirements || []
                );
            });

            // Create and execute H3 command
            const command = new OptimizeRouteH3Command(
                request.driverId,
                driverLocation,
                deliveries,
                request.h3Resolution || 9,
                request.algorithm || H3OptimizationAlgorithm.GREEDY,
                request.vehicleCapacity || 1000,
                request.vehicleVolume || 10
            );

            const result = await this.commandBus.execute(command);

            // Convert domain entity to response DTO
            return {
                driverId: result.driverId,
                optimizedRoute: result.optimizedRoute.map(point => ({
                    order: point.order,
                    deliveryId: point.deliveryId,
                    address: point.address,
                    coordinates: {
                        latitude: point.coordinates.latitude,
                        longitude: point.coordinates.longitude
                    },
                    h3Index: point.h3Index,
                    distanceFromPrevious: point.distanceFromPrevious,
                    estimatedTime: point.estimatedTime,
                    cumulativeDistance: point.cumulativeDistance,
                    cumulativeTime: point.cumulativeTime,
                    trafficLevel: point.trafficLevel,
                    weatherCondition: point.weatherCondition
                })),
                totalDistance: result.totalDistance,
                totalTime: result.totalTime,
                fuelEstimate: result.fuelEstimate,
                efficiency: result.efficiency,
                algorithm: result.algorithm,
                h3Resolution: result.h3Resolution,
                trafficAnalysis: result.trafficAnalysis ? {
                    centerH3: result.trafficAnalysis.centerH3,
                    cellsAnalyzed: result.trafficAnalysis.cellsAnalyzed,
                    trafficHotspots: result.trafficAnalysis.trafficHotspots.map(hotspot => ({
                        h3Index: hotspot.h3Index,
                        trafficLevel: hotspot.trafficLevel,
                        congestionScore: hotspot.congestionScore,
                        coordinates: {
                            latitude: hotspot.coordinates.latitude,
                            longitude: hotspot.coordinates.longitude
                        }
                    })),
                    congestionSummary: {
                        light: result.trafficAnalysis.congestionSummary.light,
                        moderate: result.trafficAnalysis.congestionSummary.moderate,
                        heavy: result.trafficAnalysis.congestionSummary.heavy,
                        congested: result.trafficAnalysis.congestionSummary.congested
                    }
                } : undefined,
                weatherAnalysis: result.weatherAnalysis ? {
                    centerH3: result.weatherAnalysis.centerH3,
                    cellsAnalyzed: result.weatherAnalysis.cellsAnalyzed,
                    weatherZones: result.weatherAnalysis.weatherZones.map(zone => ({
                        h3Index: zone.h3Index,
                        weatherCondition: zone.weatherCondition,
                        temperature: zone.temperature,
                        humidity: zone.humidity,
                        coordinates: {
                            latitude: zone.coordinates.latitude,
                            longitude: zone.coordinates.longitude
                        }
                    })),
                    weatherAlerts: result.weatherAnalysis.weatherAlerts.map(alert => ({
                        type: alert.type,
                        severity: alert.severity,
                        description: alert.description,
                        affectedH3Cells: alert.affectedH3Cells
                    })),
                    weatherSummary: {
                        clear: result.weatherAnalysis.weatherSummary.clear,
                        cloudy: result.weatherAnalysis.weatherSummary.cloudy,
                        rain: result.weatherAnalysis.weatherSummary.rain,
                        snow: result.weatherAnalysis.weatherSummary.snow,
                        fog: result.weatherAnalysis.weatherSummary.fog
                    }
                } : undefined,
                sustainabilityScore: result.sustainabilityScore,
                message: result.message
            };
        } catch (error) {
            throw new HttpException(
                `H3 route optimization failed: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
} 