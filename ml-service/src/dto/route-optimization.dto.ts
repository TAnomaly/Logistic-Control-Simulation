import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CoordinatesDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;
}

export class DeliveryPointDto {
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
}

export class OptimizeRouteRequestDto {
    @IsString()
    driverId: string;

    @ValidateNested()
    @Type(() => CoordinatesDto)
    driverLocation: CoordinatesDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DeliveryPointDto)
    deliveries: DeliveryPointDto[];

    @IsOptional()
    @IsNumber()
    vehicleCapacity?: number;

    @IsOptional()
    @IsNumber()
    vehicleVolume?: number;
}

export class OptimizedRoutePointDto {
    order: number;
    deliveryId: string;
    address: string;
    coordinates: CoordinatesDto;
    distanceFromPrevious: number;
    estimatedTime: number;
    cumulativeDistance: number;
    cumulativeTime: number;
}

export class OptimizeRouteResponseDto {
    driverId: string;
    optimizedRoute: OptimizedRoutePointDto[];
    totalDistance: number;
    totalTime: number;
    fuelEstimate: number;
    efficiency: number;
    algorithm: string;
    message?: string;
} 