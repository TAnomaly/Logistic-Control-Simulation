import { IsString, IsNotEmpty } from 'class-validator';

/**
 * GetShipmentByTrackingQuery - Takip numarasına göre gönderi bilgisi almak için kullanılan query sınıfı
 * CQRS pattern'e göre okuma operasyonları için kullanılır
 */
export class GetShipmentByTrackingQuery {
    constructor(public readonly trackingNumber: string) { }
}

/**
 * GetShipmentByTrackingDto - API katmanından gelen takip numarası parametresini validate etmek için kullanılan DTO
 */
export class GetShipmentByTrackingDto {
    /**
     * Gönderi takip numarası
     */
    @IsString({ message: 'Takip numarası string olmalıdır' })
    @IsNotEmpty({ message: 'Takip numarası boş olamaz' })
    trackingNumber: string;

    /**
     * DTO'yu Query'ye dönüştürür
     */
    toQuery(): GetShipmentByTrackingQuery {
        return new GetShipmentByTrackingQuery(this.trackingNumber);
    }
} 