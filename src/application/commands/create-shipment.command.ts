import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * CreateShipmentCommand - Yeni gönderi oluşturmak için kullanılan komut sınıfı
 * CQRS pattern'e göre yazma operasyonları için kullanılır
 */
export class CreateShipmentCommand {
    constructor(
        public readonly senderName: string,
        public readonly senderAddress: string,
        public readonly receiverName: string,
        public readonly receiverAddress: string,
        public readonly weight: number,
        public readonly length: number,
        public readonly width: number,
        public readonly height: number,
        public readonly estimatedDeliveryDate?: Date,
    ) { }
}

/**
 * CreateShipmentDto - API katmanından gelen veriyi validate etmek için kullanılan DTO
 */
export class CreateShipmentDto {
    /**
     * Gönderici adı ve soyadı
     */
    @IsString({ message: 'Gönderici adı string olmalıdır' })
    @IsNotEmpty({ message: 'Gönderici adı boş olamaz' })
    senderName: string;

    /**
     * Gönderici adresi
     */
    @IsString({ message: 'Gönderici adresi string olmalıdır' })
    @IsNotEmpty({ message: 'Gönderici adresi boş olamaz' })
    senderAddress: string;

    /**
     * Alıcı adı ve soyadı
     */
    @IsString({ message: 'Alıcı adı string olmalıdır' })
    @IsNotEmpty({ message: 'Alıcı adı boş olamaz' })
    receiverName: string;

    /**
     * Alıcı adresi
     */
    @IsString({ message: 'Alıcı adresi string olmalıdır' })
    @IsNotEmpty({ message: 'Alıcı adresi boş olamaz' })
    receiverAddress: string;

    /**
     * Gönderi ağırlığı (kg)
     */
    @IsNumber({}, { message: 'Ağırlık sayı olmalıdır' })
    @Min(0.001, { message: 'Ağırlık 0.001 kg\'dan büyük olmalıdır' })
    weight: number;

    /**
     * Gönderi uzunluğu (cm)
     */
    @IsNumber({}, { message: 'Uzunluk sayı olmalıdır' })
    @Min(1, { message: 'Uzunluk 1 cm\'den büyük olmalıdır' })
    length: number;

    /**
     * Gönderi genişliği (cm)
     */
    @IsNumber({}, { message: 'Genişlik sayı olmalıdır' })
    @Min(1, { message: 'Genişlik 1 cm\'den büyük olmalıdır' })
    width: number;

    /**
     * Gönderi yüksekliği (cm)
     */
    @IsNumber({}, { message: 'Yükseklik sayı olmalıdır' })
    @Min(1, { message: 'Yükseklik 1 cm\'den büyük olmalıdır' })
    height: number;

    /**
     * Tahmini teslimat tarihi (opsiyonel)
     */
    @IsOptional()
    estimatedDeliveryDate?: Date;

    /**
     * DTO'yu Command'e dönüştürür
     */
    toCommand(): CreateShipmentCommand {
        return new CreateShipmentCommand(
            this.senderName,
            this.senderAddress,
            this.receiverName,
            this.receiverAddress,
            this.weight,
            this.length,
            this.width,
            this.height,
            this.estimatedDeliveryDate,
        );
    }
} 