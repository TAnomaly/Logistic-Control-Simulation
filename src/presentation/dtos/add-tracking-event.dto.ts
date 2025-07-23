import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrackingEventType } from '../../domain/value-objects/tracking-event-type.vo';

/**
 * AddTrackingEventDto - Yeni takip eventi ekleme için DTO
 */
export class AddTrackingEventDto {
    @IsString()
    shipmentId: string;

    @IsString()
    gateId: string;

    @IsEnum(TrackingEventType)
    eventType: TrackingEventType;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    processedBy?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1440) // 24 saat = 1440 dakika
    @Transform(({ value }) => parseInt(value))
    processingDurationMinutes?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(10000) // Maksimum 10 ton
    @Transform(({ value }) => parseFloat(value))
    measuredWeight?: number;

    @IsOptional()
    @IsNumber()
    @Min(-50)
    @Max(70)
    @Transform(({ value }) => parseFloat(value))
    temperature?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Transform(({ value }) => parseFloat(value))
    humidity?: number;

    @IsOptional()
    @IsDateString()
    eventTimestamp?: string;
} 