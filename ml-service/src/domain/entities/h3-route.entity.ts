import { H3Index } from 'h3-js';

export class H3RouteOptimization {
    constructor(
        public readonly driverId: string,
        public readonly optimizedRoute: H3OptimizedRoutePoint[],
        public readonly totalDistance: number,
        public readonly totalTime: number,
        public readonly fuelEstimate: number,
        public readonly efficiency: number,
        public readonly algorithm: string,
        public readonly h3Resolution: number,
        public readonly trafficAnalysis?: H3TrafficAnalysis,
        public readonly weatherAnalysis?: H3WeatherAnalysis,
        public readonly sustainabilityScore?: number,
        public readonly message?: string
    ) { }
}

export class H3OptimizedRoutePoint {
    constructor(
        public readonly order: number,
        public readonly deliveryId: string,
        public readonly address: string,
        public readonly coordinates: Coordinates,
        public readonly h3Index: H3Index,
        public readonly distanceFromPrevious: number,
        public readonly estimatedTime: number,
        public readonly cumulativeDistance: number,
        public readonly cumulativeTime: number,
        public readonly trafficLevel?: TrafficLevel,
        public readonly weatherCondition?: WeatherCondition
    ) { }
}

export class H3DeliveryPoint {
    constructor(
        public readonly id: string,
        public readonly address: string,
        public readonly coordinates: Coordinates,
        public readonly h3Index: H3Index,
        public readonly priority: PriorityEnum = PriorityEnum.MEDIUM,
        public readonly weight: number = 0,
        public readonly volume: number = 0,
        public readonly timeWindow?: TimeWindow,
        public readonly serviceTimeMin: number = 5,
        public readonly specialRequirements?: string[]
    ) { }
}

export class H3TrafficAnalysis {
    constructor(
        public readonly centerH3: H3Index,
        public readonly cellsAnalyzed: number,
        public readonly trafficHotspots: H3TrafficHotspot[],
        public readonly congestionSummary: TrafficCongestionSummary
    ) { }
}

export class H3TrafficHotspot {
    constructor(
        public readonly h3Index: H3Index,
        public readonly trafficLevel: TrafficLevel,
        public readonly congestionScore: number,
        public readonly coordinates: Coordinates
    ) { }
}

export class TrafficCongestionSummary {
    constructor(
        public readonly light: number,
        public readonly moderate: number,
        public readonly heavy: number,
        public readonly congested: number
    ) { }
}

export class H3WeatherAnalysis {
    constructor(
        public readonly centerH3: H3Index,
        public readonly cellsAnalyzed: number,
        public readonly weatherZones: H3WeatherZone[],
        public readonly weatherAlerts: WeatherAlert[],
        public readonly weatherSummary: WeatherSummary
    ) { }
}

export class H3WeatherZone {
    constructor(
        public readonly h3Index: H3Index,
        public readonly weatherCondition: WeatherCondition,
        public readonly temperature: number,
        public readonly humidity: number,
        public readonly coordinates: Coordinates
    ) { }
}

export class WeatherAlert {
    constructor(
        public readonly type: string,
        public readonly severity: string,
        public readonly description: string,
        public readonly affectedH3Cells: H3Index[]
    ) { }
}

export class WeatherSummary {
    constructor(
        public readonly clear: number,
        public readonly cloudy: number,
        public readonly rain: number,
        public readonly snow: number,
        public readonly fog: number
    ) { }
}

export class TimeWindow {
    constructor(
        public readonly start: string, // HH:mm format
        public readonly end: string    // HH:mm format
    ) { }
}

export enum TrafficLevel {
    LIGHT = 'light',
    MODERATE = 'moderate',
    HEAVY = 'heavy',
    CONGESTED = 'congested'
}

export enum WeatherCondition {
    CLEAR = 'clear',
    CLOUDY = 'cloudy',
    RAIN = 'rain',
    SNOW = 'snow',
    FOG = 'fog'
}

export enum PriorityEnum {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low'
}

export class Coordinates {
    constructor(
        public readonly latitude: number,
        public readonly longitude: number
    ) { }
} 