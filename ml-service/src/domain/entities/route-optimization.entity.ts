export class RouteOptimization {
    constructor(
        public readonly driverId: string,
        public readonly optimizedRoute: OptimizedRoutePoint[],
        public readonly totalDistance: number,
        public readonly totalTime: number,
        public readonly fuelEstimate: number,
        public readonly efficiency: number,
        public readonly algorithm: string,
        public readonly message?: string
    ) { }
}

export class OptimizedRoutePoint {
    constructor(
        public readonly order: number,
        public readonly deliveryId: string,
        public readonly address: string,
        public readonly coordinates: Coordinates,
        public readonly distanceFromPrevious: number,
        public readonly estimatedTime: number,
        public readonly cumulativeDistance: number,
        public readonly cumulativeTime: number
    ) { }
}

export class Coordinates {
    constructor(
        public readonly latitude: number,
        public readonly longitude: number
    ) { }
}

export class DeliveryPoint {
    constructor(
        public readonly id: string,
        public readonly address: string,
        public readonly coordinates: Coordinates,
        public readonly priority: PriorityEnum = PriorityEnum.MEDIUM,
        public readonly weight: number = 0,
        public readonly volume: number = 0
    ) { }
}

export enum PriorityEnum {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low'
} 