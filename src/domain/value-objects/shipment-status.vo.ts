/**
 * ShipmentStatus - Gönderi durumlarını temsil eden Value Object
 * Immutable ve business rule'ları encapsulate eden yapı
 */
export enum ShipmentStatus {
    /**
     * Oluşturuldu - Gönderi sisteme kaydedildi
     */
    CREATED = 'CREATED',

    /**
     * Alındı - Gönderi kargo şirketine teslim edildi
     */
    PICKED_UP = 'PICKED_UP',

    /**
     * Transit - Gönderi dağıtım merkezleri arasında taşınıyor
     */
    IN_TRANSIT = 'IN_TRANSIT',

    /**
     * Dağıtım merkezinde - Gönderi yerel dağıtım merkezine ulaştı
     */
    AT_DISTRIBUTION_CENTER = 'AT_DISTRIBUTION_CENTER',

    /**
     * Çıkış kapısında - Gönderi son teslimat için hazırlandı
     */
    AT_DELIVERY_GATE = 'AT_DELIVERY_GATE',

    /**
     * Teslimat yolunda - Kurye gönderiyi teslimat için aldı
     */
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',

    /**
     * Teslim edildi - Gönderi başarıyla teslim edildi
     */
    DELIVERED = 'DELIVERED',

    /**
     * Teslim edilemedi - Teslimat girişimi başarısız
     */
    DELIVERY_FAILED = 'DELIVERY_FAILED',

    /**
     * İade - Gönderi gönderene iade ediliyor
     */
    RETURNED = 'RETURNED',

    /**
     * İptal edildi - Gönderi iptal edildi
     */
    CANCELLED = 'CANCELLED'
}

/**
 * ShipmentStatus için helper fonksiyonlar
 */
export class ShipmentStatusHelper {
    /**
     * Durumun terminal durumu olup olmadığını kontrol eder
     */
    public static isTerminalStatus(status: ShipmentStatus): boolean {
        return [
            ShipmentStatus.DELIVERED,
            ShipmentStatus.CANCELLED,
            ShipmentStatus.RETURNED
        ].includes(status);
    }

    /**
     * Durumun aktif süreçte olup olmadığını kontrol eder
     */
    public static isActiveStatus(status: ShipmentStatus): boolean {
        return [
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.AT_DISTRIBUTION_CENTER,
            ShipmentStatus.AT_DELIVERY_GATE,
            ShipmentStatus.OUT_FOR_DELIVERY
        ].includes(status);
    }

    /**
     * Durum geçişinin geçerli olup olmadığını kontrol eder
     */
    public static isValidTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
        const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
            [ShipmentStatus.CREATED]: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELLED],
            [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
            [ShipmentStatus.IN_TRANSIT]: [
                ShipmentStatus.AT_DISTRIBUTION_CENTER,
                ShipmentStatus.DELIVERY_FAILED,
                ShipmentStatus.CANCELLED
            ],
            [ShipmentStatus.AT_DISTRIBUTION_CENTER]: [
                ShipmentStatus.AT_DELIVERY_GATE,
                ShipmentStatus.IN_TRANSIT,
                ShipmentStatus.CANCELLED
            ],
            [ShipmentStatus.AT_DELIVERY_GATE]: [
                ShipmentStatus.OUT_FOR_DELIVERY,
                ShipmentStatus.CANCELLED
            ],
            [ShipmentStatus.OUT_FOR_DELIVERY]: [
                ShipmentStatus.DELIVERED,
                ShipmentStatus.DELIVERY_FAILED
            ],
            [ShipmentStatus.DELIVERY_FAILED]: [
                ShipmentStatus.OUT_FOR_DELIVERY,
                ShipmentStatus.RETURNED,
                ShipmentStatus.CANCELLED
            ],
            [ShipmentStatus.DELIVERED]: [],
            [ShipmentStatus.RETURNED]: [],
            [ShipmentStatus.CANCELLED]: []
        };

        return validTransitions[from]?.includes(to) || false;
    }
} 