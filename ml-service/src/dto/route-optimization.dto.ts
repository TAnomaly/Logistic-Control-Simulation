export class DeliveryPointDto {
    address: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime?: number; // minutes
    weight?: number;
}

export class RouteOptimizationDto {
    deliveries: DeliveryPointDto[];
    driverLocation: {
        latitude: number;
        longitude: number;
    };
    vehicleCapacity?: number;
    timeWindow?: {
        start: string; // HH:mm
        end: string;   // HH:mm
    };
}

export class OptimizedRouteResponseDto {
    optimizedRoute: {
        address: string;
        estimatedTime: number; // minutes
        distance: number;      // km
        order: number;
    }[];
    totalDistance: number;   // km
    totalTime: number;       // minutes
    fuelEstimate: number;    // liters
    efficiency: number;      // percentage
} 