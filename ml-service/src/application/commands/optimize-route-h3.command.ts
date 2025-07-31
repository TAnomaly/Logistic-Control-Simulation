import { H3DeliveryPoint } from '../../domain/entities/h3-route.entity';
import { Coordinates } from '../../domain/entities/h3-route.entity';
import { H3OptimizationAlgorithm } from '../../domain/repositories/h3-route-optimization.repository';

export class OptimizeRouteH3Command {
    constructor(
        public readonly driverId: string,
        public readonly driverLocation: Coordinates,
        public readonly deliveries: H3DeliveryPoint[],
        public readonly h3Resolution: number = 9,
        public readonly algorithm: H3OptimizationAlgorithm = H3OptimizationAlgorithm.GREEDY,
        public readonly vehicleCapacity: number = 1000,
        public readonly vehicleVolume: number = 10
    ) { }
} 