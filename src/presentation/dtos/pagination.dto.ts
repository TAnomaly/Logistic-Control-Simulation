import { IsOptional, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * PaginationDto - Sayfalama için ortak DTO
 */
export class PaginationDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value) || 1)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => parseInt(value) || 10)
    limit?: number;

    // Gate-specific filters
    @IsOptional()
    @IsString()
    gateType?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return undefined;
    })
    isActive?: boolean;

    @IsOptional()
    @IsString()
    locationName?: string;

    // Shipment-specific filters
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    senderName?: string;

    @IsOptional()
    @IsString()
    receiverName?: string;
} 