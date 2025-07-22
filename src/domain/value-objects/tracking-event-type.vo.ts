/**
 * TrackingEventType - İzleme olay türlerini temsil eden Value Object
 * Gönderilerin lojistik süreçteki farklı aşamalarını tanımlar
 */
export enum TrackingEventType {
    /**
     * Giriş - Gönderi kapıdan giriş yaptı
     */
    ENTRY = 'ENTRY',

    /**
     * Çıkış - Gönderi kapıdan çıkış yaptı
     */
    EXIT = 'EXIT',

    /**
     * Sıralama - Gönderi sıralama işlemine tabi tutuldu
     */
    SORTING = 'SORTING',

    /**
     * Sıralama Tamamlandı - Sıralama işlemi başarıyla tamamlandı
     */
    SORTING_COMPLETED = 'SORTING_COMPLETED',

    /**
     * Depolamaya Yerleştirildi - Gönderi depoya yerleştirildi
     */
    STORED = 'STORED',

    /**
     * Depodan Alındı - Gönderi depodan alındı
     */
    RETRIEVED_FROM_STORAGE = 'RETRIEVED_FROM_STORAGE',

    /**
     * Yükleme Başladı - Araca yükleme işlemi başladı
     */
    LOADING_STARTED = 'LOADING_STARTED',

    /**
     * Yükleme Tamamlandı - Araca yükleme işlemi tamamlandı
     */
    LOADING_COMPLETED = 'LOADING_COMPLETED',

    /**
     * Transfer Hazırlığı - Başka tesise transfer için hazırlandı
     */
    TRANSFER_PREPARED = 'TRANSFER_PREPARED',

    /**
     * Transfer Edildi - Başka tesise transfer edildi
     */
    TRANSFERRED = 'TRANSFERRED',

    /**
     * Kalite Kontrol - Kalite kontrol sürecinden geçirildi
     */
    QUALITY_CHECK = 'QUALITY_CHECK',

    /**
     * Kalite Kontrolü Geçti - Kalite kontrol başarıyla geçildi
     */
    QUALITY_CHECK_PASSED = 'QUALITY_CHECK_PASSED',

    /**
     * Kalite Kontrolü Başarısız - Kalite kontrol başarısız
     */
    QUALITY_CHECK_FAILED = 'QUALITY_CHECK_FAILED',

    /**
     * Gümrük İşlemi - Gümrük işlemlerine tabi tutuldu
     */
    CUSTOMS_PROCESSING = 'CUSTOMS_PROCESSING',

    /**
     * Gümrük Onaylandı - Gümrük işlemleri tamamlandı
     */
    CUSTOMS_CLEARED = 'CUSTOMS_CLEARED',

    /**
     * Gümrük Beklemede - Gümrük işlemleri için beklemede
     */
    CUSTOMS_PENDING = 'CUSTOMS_PENDING',

    /**
     * Bakım/Onarım - Bakım veya onarım işlemine alındı
     */
    MAINTENANCE = 'MAINTENANCE',

    /**
     * Bakım Tamamlandı - Bakım/onarım işlemi tamamlandı
     */
    MAINTENANCE_COMPLETED = 'MAINTENANCE_COMPLETED',

    /**
     * Teslimat İçin Ayrıldı - Son teslimat için araçtan ayrıldı
     */
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',

    /**
     * Teslimat Girişimi - Teslimat girişiminde bulunuldu
     */
    DELIVERY_ATTEMPTED = 'DELIVERY_ATTEMPTED',

    /**
     * Teslimat Başarılı - Gönderi başarıyla teslim edildi
     */
    DELIVERED = 'DELIVERED',

    /**
     * Teslimat Başarısız - Teslimat girişimi başarısız oldu
     */
    DELIVERY_FAILED = 'DELIVERY_FAILED',

    /**
     * İade Edildi - Gönderi gönderene iade edildi
     */
    RETURNED = 'RETURNED',

    /**
     * İptal Edildi - Gönderi iptal edildi
     */
    CANCELLED = 'CANCELLED',

    /**
     * Beklemede - Gönderi belirli bir sebeple beklemede
     */
    ON_HOLD = 'ON_HOLD',

    /**
     * Gecikme - Gönderi planlanandan geç kaldı
     */
    DELAYED = 'DELAYED',

    /**
     * Hasar Tespit Edildi - Gönderide hasar tespit edildi
     */
    DAMAGE_DETECTED = 'DAMAGE_DETECTED',

    /**
     * Kayıp - Gönderi kayıp olarak işaretlendi
     */
    LOST = 'LOST',

    /**
     * Bulundu - Kayıp gönderi bulundu
     */
    FOUND = 'FOUND',

    /**
     * Güvenlik Kontrolü - Güvenlik kontrol sürecinden geçirildi
     */
    SECURITY_CHECK = 'SECURITY_CHECK',

    /**
     * Rota Güncellendi - Gönderi rotası güncellendi
     */
    ROUTE_UPDATED = 'ROUTE_UPDATED'
}

/**
 * TrackingEventType için helper fonksiyonlar ve business rules
 */
export class TrackingEventTypeHelper {
    /**
     * Olayın terminal olay olup olmadığını kontrol eder (süreç sonu)
     */
    public static isTerminalEvent(eventType: TrackingEventType): boolean {
        return [
            TrackingEventType.DELIVERED,
            TrackingEventType.RETURNED,
            TrackingEventType.CANCELLED,
            TrackingEventType.LOST
        ].includes(eventType);
    }

    /**
     * Olayın işlem gerektiren olay olup olmadığını kontrol eder
     */
    public static requiresProcessing(eventType: TrackingEventType): boolean {
        return [
            TrackingEventType.SORTING,
            TrackingEventType.QUALITY_CHECK,
            TrackingEventType.CUSTOMS_PROCESSING,
            TrackingEventType.MAINTENANCE,
            TrackingEventType.SECURITY_CHECK
        ].includes(eventType);
    }

    /**
     * Olayın başarı durumunu kontrol eder
     */
    public static isSuccessEvent(eventType: TrackingEventType): boolean {
        return [
            TrackingEventType.SORTING_COMPLETED,
            TrackingEventType.LOADING_COMPLETED,
            TrackingEventType.QUALITY_CHECK_PASSED,
            TrackingEventType.CUSTOMS_CLEARED,
            TrackingEventType.MAINTENANCE_COMPLETED,
            TrackingEventType.DELIVERED,
            TrackingEventType.FOUND
        ].includes(eventType);
    }

    /**
     * Olayın başarısızlık durumunu kontrol eder
     */
    public static isFailureEvent(eventType: TrackingEventType): boolean {
        return [
            TrackingEventType.QUALITY_CHECK_FAILED,
            TrackingEventType.DELIVERY_FAILED,
            TrackingEventType.DAMAGE_DETECTED,
            TrackingEventType.LOST,
            TrackingEventType.CANCELLED
        ].includes(eventType);
    }

    /**
     * Olayın bekleme durumu olup olmadığını kontrol eder
     */
    public static isWaitingEvent(eventType: TrackingEventType): boolean {
        return [
            TrackingEventType.STORED,
            TrackingEventType.CUSTOMS_PENDING,
            TrackingEventType.ON_HOLD,
            TrackingEventType.DELAYED
        ].includes(eventType);
    }

    /**
     * Olayın hareket durumu olup olmadığını kontrol eder
     */
    public static isMovementEvent(eventType: TrackingEventType): boolean {
        return [
            TrackingEventType.ENTRY,
            TrackingEventType.EXIT,
            TrackingEventType.TRANSFERRED,
            TrackingEventType.OUT_FOR_DELIVERY,
            TrackingEventType.ROUTE_UPDATED
        ].includes(eventType);
    }

    /**
     * Olay türü için tahmini süreyi döner (dakika cinsinden)
     */
    public static getEstimatedDuration(eventType: TrackingEventType): number {
        const durationMap: Record<TrackingEventType, number> = {
            [TrackingEventType.ENTRY]: 2,
            [TrackingEventType.EXIT]: 2,
            [TrackingEventType.SORTING]: 15,
            [TrackingEventType.SORTING_COMPLETED]: 1,
            [TrackingEventType.STORED]: 5,
            [TrackingEventType.RETRIEVED_FROM_STORAGE]: 5,
            [TrackingEventType.LOADING_STARTED]: 1,
            [TrackingEventType.LOADING_COMPLETED]: 1,
            [TrackingEventType.TRANSFER_PREPARED]: 10,
            [TrackingEventType.TRANSFERRED]: 5,
            [TrackingEventType.QUALITY_CHECK]: 20,
            [TrackingEventType.QUALITY_CHECK_PASSED]: 1,
            [TrackingEventType.QUALITY_CHECK_FAILED]: 1,
            [TrackingEventType.CUSTOMS_PROCESSING]: 60,
            [TrackingEventType.CUSTOMS_CLEARED]: 5,
            [TrackingEventType.CUSTOMS_PENDING]: 0,
            [TrackingEventType.MAINTENANCE]: 120,
            [TrackingEventType.MAINTENANCE_COMPLETED]: 5,
            [TrackingEventType.OUT_FOR_DELIVERY]: 5,
            [TrackingEventType.DELIVERY_ATTEMPTED]: 15,
            [TrackingEventType.DELIVERED]: 10,
            [TrackingEventType.DELIVERY_FAILED]: 5,
            [TrackingEventType.RETURNED]: 10,
            [TrackingEventType.CANCELLED]: 2,
            [TrackingEventType.ON_HOLD]: 0,
            [TrackingEventType.DELAYED]: 0,
            [TrackingEventType.DAMAGE_DETECTED]: 10,
            [TrackingEventType.LOST]: 1,
            [TrackingEventType.FOUND]: 1,
            [TrackingEventType.SECURITY_CHECK]: 30,
            [TrackingEventType.ROUTE_UPDATED]: 2
        };

        return durationMap[eventType] || 5;
    }

    /**
 * Olay türü için öncelik seviyesini döner (1: En yüksek, 10: En düşük)
 */
    public static getPriorityLevel(eventType: TrackingEventType): number {
        const priorityMap: Record<TrackingEventType, number> = {
            [TrackingEventType.LOST]: 1,
            [TrackingEventType.DELIVERED]: 1,
            [TrackingEventType.DAMAGE_DETECTED]: 2,
            [TrackingEventType.FOUND]: 2,
            [TrackingEventType.DELIVERY_FAILED]: 3,
            [TrackingEventType.QUALITY_CHECK_FAILED]: 3,
            [TrackingEventType.CANCELLED]: 3,
            [TrackingEventType.DELAYED]: 4,
            [TrackingEventType.ON_HOLD]: 4,
            [TrackingEventType.CUSTOMS_PENDING]: 5,
            [TrackingEventType.OUT_FOR_DELIVERY]: 6,
            [TrackingEventType.DELIVERY_ATTEMPTED]: 6,
            [TrackingEventType.MAINTENANCE]: 7,
            [TrackingEventType.QUALITY_CHECK]: 7,
            [TrackingEventType.CUSTOMS_PROCESSING]: 7,
            [TrackingEventType.SECURITY_CHECK]: 7,
            [TrackingEventType.SORTING]: 8,
            [TrackingEventType.LOADING_STARTED]: 8,
            [TrackingEventType.TRANSFER_PREPARED]: 8,
            [TrackingEventType.SORTING_COMPLETED]: 8,
            [TrackingEventType.LOADING_COMPLETED]: 8,
            [TrackingEventType.QUALITY_CHECK_PASSED]: 8,
            [TrackingEventType.CUSTOMS_CLEARED]: 8,
            [TrackingEventType.MAINTENANCE_COMPLETED]: 8,
            [TrackingEventType.TRANSFERRED]: 8,
            [TrackingEventType.RETURNED]: 8,
            [TrackingEventType.ENTRY]: 9,
            [TrackingEventType.EXIT]: 9,
            [TrackingEventType.STORED]: 10,
            [TrackingEventType.RETRIEVED_FROM_STORAGE]: 10,
            [TrackingEventType.ROUTE_UPDATED]: 10
        };

        return priorityMap[eventType] || 8;
    }
} 