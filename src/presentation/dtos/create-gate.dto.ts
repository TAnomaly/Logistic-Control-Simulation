import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Matches, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { GateType } from '../../domain/value-objects/gate-type.vo';

/**
 * CreateGateDto - Yeni kapı oluşturma için DTO
 */
export class CreateGateDto {
    @IsString()
    gateCode: string;

    @IsString()
    name: string;

    @IsEnum(GateType)
    gateType: GateType;

    @IsString()
    locationName: string;

    @IsString()
    address: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Transform(({ value }) => parseFloat(value))
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Transform(({ value }) => parseFloat(value))
    longitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(1000)
    @Transform(({ value }) => parseInt(value))
    hourlyCapacity?: number;

    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'operatingHoursStart must be in HH:MM format'
    })
    operatingHoursStart?: string;

    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'operatingHoursEnd must be in HH:MM format'
    })
    operatingHoursEnd?: string;
} 