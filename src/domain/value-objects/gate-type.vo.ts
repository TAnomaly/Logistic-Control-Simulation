/**
 * GateType - Kapı türlerini temsil eden Value Object
 * Lojistik ağdaki farklı geçiş noktası türlerini tanımlar
 */
export enum GateType {
    /**
     * Giriş Kapısı - Tesise/depoya giriş noktası
     */
    ENTRY = 'ENTRY',

    /**
     * Çıkış Kapısı - Tesisten/depodan çıkış noktası  
     */
    EXIT = 'EXIT',

    /**
     * Sıralama Kapısı - Gönderilerin hedef lokasyonlara göre sınıflandırıldığı nokta
     */
    SORTING = 'SORTING',

    /**
     * Depolama Kapısı - Gönderilerin geçici olarak bekletildiği depo girişi
     */
    STORAGE = 'STORAGE',

    /**
     * Yükleme Kapısı - Gönderilerin araçlara yüklendiği nokta
     */
    LOADING = 'LOADING',

    /**
     * Transfer Kapısı - Gönderilerin başka tesise aktarıldığı nokta
     */
    TRANSFER = 'TRANSFER',

    /**
     * Teslimat Kapısı - Son teslimat noktası (müşteri adresi)
     */
    DELIVERY = 'DELIVERY',

    /**
     * Kalite Kontrol Kapısı - Gönderilerin kontrol edildiği nokta
     */
    QUALITY_CHECK = 'QUALITY_CHECK',

    /**
     * Gümrük Kapısı - Uluslararası gönderilerin gümrük işlemlerinin yapıldığı nokta
     */
    CUSTOMS = 'CUSTOMS',

    /**
     * Bakım Kapısı - Hasarlı gönderilerin onarım/bakım için alındığı nokta
     */
    MAINTENANCE = 'MAINTENANCE'
}

/**
 * GateType için helper fonksiyonlar ve business rules
 */
export class GateTypeHelper {
    /**
     * Kapı türünün giriş noktası olup olmadığını kontrol eder
     */
    public static isEntryPoint(gateType: GateType): boolean {
        return [
            GateType.ENTRY,
            GateType.TRANSFER
        ].includes(gateType);
    }

    /**
     * Kapı türünün çıkış noktası olup olmadığını kontrol eder
     */
    public static isExitPoint(gateType: GateType): boolean {
        return [
            GateType.EXIT,
            GateType.DELIVERY,
            GateType.TRANSFER
        ].includes(gateType);
    }

    /**
     * Kapı türünün işleme noktası olup olmadığını kontrol eder
     */
    public static isProcessingPoint(gateType: GateType): boolean {
        return [
            GateType.SORTING,
            GateType.QUALITY_CHECK,
            GateType.CUSTOMS,
            GateType.MAINTENANCE
        ].includes(gateType);
    }

    /**
     * Kapı türünün depolama noktası olup olmadığını kontrol eder
     */
    public static isStoragePoint(gateType: GateType): boolean {
        return GateType.STORAGE === gateType;
    }

    /**
     * Kapı türünün terminal nokta olup olmadığını kontrol eder
     */
    public static isTerminalPoint(gateType: GateType): boolean {
        return GateType.DELIVERY === gateType;
    }

    /**
     * Kapı türünün öncelik seviyesini döner (1: En yüksek, 10: En düşük)
     */
    public static getPriorityLevel(gateType: GateType): number {
        const priorityMap: Record<GateType, number> = {
            [GateType.DELIVERY]: 1,        // En yüksek öncelik - müşteri teslimi
            [GateType.CUSTOMS]: 2,         // Gümrük işlemleri kritik
            [GateType.QUALITY_CHECK]: 3,   // Kalite kontrol önemli
            [GateType.LOADING]: 4,         // Yükleme işlemi
            [GateType.SORTING]: 5,         // Sıralama işlemi
            [GateType.TRANSFER]: 6,        // Transfer işlemi
            [GateType.EXIT]: 7,           // Çıkış işlemi
            [GateType.STORAGE]: 8,        // Depolama işlemi
            [GateType.MAINTENANCE]: 9,    // Bakım işlemi
            [GateType.ENTRY]: 10          // En düşük öncelik - giriş
        };

        return priorityMap[gateType] || 10;
    }

    /**
     * Kapı türü için uygun işlem süresini döner (dakika cinsinden)
     */
    public static getEstimatedProcessingTime(gateType: GateType): number {
        const processingTimeMap: Record<GateType, number> = {
            [GateType.ENTRY]: 5,           // Giriş tarama
            [GateType.SORTING]: 10,        // Sıralama işlemi
            [GateType.QUALITY_CHECK]: 15,  // Kalite kontrol
            [GateType.STORAGE]: 3,         // Depolama yerleştirme
            [GateType.LOADING]: 8,         // Araç yükleme
            [GateType.TRANSFER]: 12,       // Transfer hazırlığı
            [GateType.EXIT]: 5,            // Çıkış kontrolü
            [GateType.CUSTOMS]: 30,        // Gümrük işlemleri
            [GateType.DELIVERY]: 10,       // Teslimat
            [GateType.MAINTENANCE]: 60     // Bakım onarım
        };

        return processingTimeMap[gateType] || 10;
    }
} 