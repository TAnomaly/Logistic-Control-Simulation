import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateDriverDto {
    @IsString({ message: 'Ad string olmalıdır' })
    @IsNotEmpty({ message: 'Ad boş olamaz' })
    firstName: string;

    @IsString({ message: 'Soyad string olmalıdır' })
    @IsNotEmpty({ message: 'Soyad boş olamaz' })
    lastName: string;

    @IsString({ message: 'Plaka string olmalıdır' })
    @IsNotEmpty({ message: 'Plaka boş olamaz' })
    licensePlate: string;

    @IsBoolean({ message: 'Aktiflik durumu boolean olmalıdır' })
    @IsOptional()
    isActive?: boolean;
}

export class UpdateDriverLocationDto {
    @IsNumber({}, { message: 'Enlem sayı olmalıdır' })
    latitude: number;

    @IsNumber({}, { message: 'Boylam sayı olmalıdır' })
    longitude: number;
}

export class DriverResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    licensePlate: string;
    isActive: boolean;
    lastLatitude?: number;
    lastLongitude?: number;
    lastLocationUpdate?: Date;
    createdAt: Date;
    updatedAt: Date;
} 