import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum ShipmentStatus {
    CREATED = 'CREATED',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    RETURNED = 'RETURNED',
}

export class CreateShipmentDto {
    @IsString({ message: 'Gönderici adı string olmalıdır' })
    @IsNotEmpty({ message: 'Gönderici adı boş olamaz' })
    senderName: string;

    @IsString({ message: 'Gönderici adresi string olmalıdır' })
    @IsNotEmpty({ message: 'Gönderici adresi boş olamaz' })
    senderAddress: string;

    @IsString({ message: 'Alıcı adı string olmalıdır' })
    @IsNotEmpty({ message: 'Alıcı adı boş olamaz' })
    receiverName: string;

    @IsString({ message: 'Alıcı adresi string olmalıdır' })
    @IsNotEmpty({ message: 'Alıcı adresi boş olamaz' })
    receiverAddress: string;

    @IsNumber({}, { message: 'Ağırlık sayı olmalıdır' })
    weight: number;

    @IsNumber({}, { message: 'Uzunluk sayı olmalıdır' })
    length: number;

    @IsNumber({}, { message: 'Genişlik sayı olmalıdır' })
    width: number;

    @IsNumber({}, { message: 'Yükseklik sayı olmalıdır' })
    height: number;
}

export class ShipmentResponseDto {
    id: string;
    trackingNumber: string;
    senderName: string;
    senderAddress: string;
    receiverName: string;
    receiverAddress: string;
    status: ShipmentStatus;
    weight: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
        volume: number;
    };
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    createdAt: Date;
    updatedAt: Date;
} 