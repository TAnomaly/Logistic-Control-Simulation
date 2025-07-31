import { DeliveryPoint } from '../../domain/entities/route-optimization.entity';
import { Coordinates } from '../../domain/entities/route-optimization.entity';

export class OptimizeRouteCommand {
    constructor(
        public readonly driverId: string,
        public readonly driverLocation: Coordinates,
        public readonly deliveries: DeliveryPoint[],
        public readonly vehicleCapacity: number = 1000,
        public readonly vehicleVolume: number = 10
    ) { }
} 