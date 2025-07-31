import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { H3OptimizationAlgorithm } from '../domain/repositories/h3-route-optimization.repository';
import { TrafficLevel, WeatherCondition, PriorityEnum } from '../domain/entities/h3-route.entity';

export class CoordinatesDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;
}

export class TimeWindowDto {
    @IsString()
    start: string; // HH:mm format

    @IsString()
    end: string; // HH:mm format
}

export class H3DeliveryPointDto {
    @IsString()
    id: string;

    @IsString()
    address: string;

    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates: CoordinatesDto;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsOptional()
    @IsNumber()
    volume?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => TimeWindowDto)
    timeWindow?: TimeWindowDto;

    @IsOptional()
    @IsNumber()
    serviceTimeMin?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specialRequirements?: string[];
}

export class OptimizeRouteH3RequestDto {
    @IsString()
    driverId: string;

    @ValidateNested()
    @Type(() => CoordinatesDto)
    driverLocation: CoordinatesDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => H3DeliveryPointDto)
    deliveries: H3DeliveryPointDto[];

    @IsOptional()
    @IsNumber()
    h3Resolution?: number;

    @IsOptional()
    @IsEnum(H3OptimizationAlgorithm)
    algorithm?: H3OptimizationAlgorithm;

    @IsOptional()
    @IsNumber()
    vehicleCapacity?: number;

    @IsOptional()
    @IsNumber()
    vehicleVolume?: number;
}

export class H3OptimizedRoutePointDto {
    order: number;
    deliveryId: string;
    address: string;
    coordinates: CoordinatesDto;
    h3Index: string;
    distanceFromPrevious: number;
    estimatedTime: number;
    cumulativeDistance: number;
    cumulativeTime: number;
    trafficLevel?: TrafficLevel;
    weatherCondition?: WeatherCondition;
}

export class H3TrafficHotspotDto {
    h3Index: string;
    trafficLevel: TrafficLevel;
    congestionScore: number;
    coordinates: CoordinatesDto;
}

export class TrafficCongestionSummaryDto {
    light: number;
    moderate: number;
    heavy: number;
    congested: number;
}

export class H3TrafficAnalysisDto {
    centerH3: string;
    cellsAnalyzed: number;
    trafficHotspots: H3TrafficHotspotDto[];
    congestionSummary: TrafficCongestionSummaryDto;
}

export class H3WeatherZoneDto {
    h3Index: string;
    weatherCondition: WeatherCondition;
    temperature: number;
    humidity: number;
    coordinates: CoordinatesDto;
}

export class WeatherAlertDto {
    type: string;
    severity: string;
    description: string;
    affectedH3Cells: string[];
}

export class WeatherSummaryDto {
    clear: number;
    cloudy: number;
    rain: number;
    snow: number;
    fog: number;
}

export class H3WeatherAnalysisDto {
    centerH3: string;
    cellsAnalyzed: number;
    weatherZones: H3WeatherZoneDto[];
    weatherAlerts: WeatherAlertDto[];
    weatherSummary: WeatherSummaryDto;
}

export class OptimizeRouteH3ResponseDto {
    driverId: string;
    optimizedRoute: H3OptimizedRoutePointDto[];
    totalDistance: number;
    totalTime: number;
    fuelEstimate: number;
    efficiency: number;
    algorithm: string;
    h3Resolution: number;
    trafficAnalysis?: H3TrafficAnalysisDto;
    weatherAnalysis?: H3WeatherAnalysisDto;
    sustainabilityScore?: number;
    message?: string;
} 