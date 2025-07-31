import { H3RouteOptimization, H3OptimizedRoutePoint, H3TrafficAnalysis, H3WeatherAnalysis } from '../entities/h3-route.entity';
import { H3DeliveryPoint } from '../entities/h3-route.entity';
import { Coordinates } from '../entities/h3-route.entity';

export interface H3RouteOptimizationRepository {
    optimizeRouteWithH3(
        driverId: string,
        driverLocation: Coordinates,
        deliveries: H3DeliveryPoint[],
        h3Resolution: number,
        algorithm: H3OptimizationAlgorithm,
        vehicleCapacity?: number,
        vehicleVolume?: number
    ): Promise<H3RouteOptimization>;

    analyzeTraffic(
        centerLat: number,
        centerLng: number,
        radiusKm: number,
        h3Resolution: number
    ): Promise<H3TrafficAnalysis>;

    analyzeWeather(
        centerLat: number,
        centerLng: number,
        radiusKm: number,
        h3Resolution: number
    ): Promise<H3WeatherAnalysis>;

    calculateSustainabilityScore(
        route: H3OptimizedRoutePoint[],
        vehicleType: string,
        loadFactor: number
    ): Promise<number>;
}

export enum H3OptimizationAlgorithm {
    GREEDY = 'greedy',
    TWO_OPT = '2-opt',
    GENETIC = 'genetic',
    ANT_COLONY = 'ant_colony'
} 