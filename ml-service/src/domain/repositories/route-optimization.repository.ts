import { RouteOptimization } from '../entities/route-optimization.entity';
import { DeliveryPoint } from '../entities/route-optimization.entity';
import { Coordinates } from '../entities/route-optimization.entity';

export interface RouteOptimizationRepository {
    optimizeRoute(
        driverId: string,
        driverLocation: Coordinates,
        deliveries: DeliveryPoint[],
        vehicleCapacity?: number,
        vehicleVolume?: number
    ): Promise<RouteOptimization>;
} 