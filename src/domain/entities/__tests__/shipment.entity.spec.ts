import { Shipment } from '../shipment.entity';
import { ShipmentStatus } from '../../value-objects/shipment-status.vo';

describe('Shipment Entity', () => {
    let shipment: Shipment;

    beforeEach(() => {
        shipment = new Shipment();
        shipment.id = 'test-id';
        shipment.trackingNumber = 'LCS-20241222-TEST01';
        shipment.senderName = 'Test Gönderici';
        shipment.senderAddress = 'İstanbul, Türkiye';
        shipment.receiverName = 'Test Alıcı';
        shipment.receiverAddress = 'Ankara, Türkiye';
        shipment.status = ShipmentStatus.CREATED;
        shipment.weight = 5.5;
        shipment.length = 30;
        shipment.width = 20;
        shipment.height = 15;
        shipment.createdAt = new Date();
        shipment.updatedAt = new Date();
    });

    describe('calculateVolume', () => {
        it('hacmi doğru hesaplamalıdır', () => {
            // Arrange
            const expectedVolume = 30 * 20 * 15; // 9000 cm³

            // Act
            const volume = shipment.calculateVolume();

            // Assert
            expect(volume).toBe(expectedVolume);
        });

        it('sıfır boyutlarda sıfır hacim döndürmelidir', () => {
            // Arrange
            shipment.length = 0;
            shipment.width = 0;
            shipment.height = 0;

            // Act
            const volume = shipment.calculateVolume();

            // Assert
            expect(volume).toBe(0);
        });

        it('negatif boyutlarda sıfır hacim döndürmelidir', () => {
            // Arrange
            shipment.length = -10;
            shipment.width = 20;
            shipment.height = 15;

            // Act
            const volume = shipment.calculateVolume();

            // Assert
            expect(volume).toBe(0);
        });
    });

    describe('updateStatus', () => {
        it('geçerli status geçişini yapabilmelidir', () => {
            // Arrange
            const newStatus = ShipmentStatus.PICKED_UP;
            const updatedBy = 'test-user';

            // Act
            shipment.updateStatus(newStatus, updatedBy);

            // Assert
            expect(shipment.status).toBe(newStatus);
            expect(shipment.updatedAt).toBeInstanceOf(Date);
        });

        it('aynı status'a güncelleme yapmamalıdır', () => {
            // Arrange
            const currentStatus = shipment.status;
        const oldUpdatedAt = shipment.updatedAt;

        // Act & Assert
        expect(() => {
            shipment.updateStatus(currentStatus, 'test-user');
        }).toThrow('Gönderi zaten bu durumda');
    });

    it('terminal status'tan başka status'a geçişe izin vermemelidir', () => {
        // Arrange
        shipment.status = ShipmentStatus.DELIVERED;

        // Act & Assert
        expect(() => {
            shipment.updateStatus(ShipmentStatus.IN_TRANSIT, 'test-user');
        }).toThrow('Terminal durumdan başka duruma geçiş yapılamaz');
    });

    it('tüm terminal status'ları doğru tespit etmelidir', () => {
            // Arrange & Act & Assert
            const terminalStatuses = [
        ShipmentStatus.DELIVERED,
        ShipmentStatus.CANCELLED,
        ShipmentStatus.RETURNED
    ];

    terminalStatuses.forEach(status => {
        shipment.status = status;
        expect(() => {
            shipment.updateStatus(ShipmentStatus.IN_TRANSIT, 'test-user');
        }).toThrow('Terminal durumdan başka duruma geçiş yapılamaz');
    });
});
    });

describe('completeDelivery', () => {
    it('teslimat tamamlandığında tarih ve status güncellemesi yapmalıdır', () => {
        // Arrange
        const deliveryDate = new Date('2024-01-15T14:30:00Z');
        const deliveredBy = 'Kurye Ali';

        // Act
        shipment.completeDelivery(deliveryDate, deliveredBy);

        // Assert
        expect(shipment.status).toBe(ShipmentStatus.DELIVERED);
        expect(shipment.actualDeliveryDate).toBe(deliveryDate);
        expect(shipment.updatedAt).toBeInstanceOf(Date);
    });

    it('zaten teslim edilmiş gönderi için hata fırlatmalıdır', () => {
        // Arrange
        shipment.status = ShipmentStatus.DELIVERED;

        // Act & Assert
        expect(() => {
            shipment.completeDelivery(new Date(), 'test-user');
        }).toThrow('Gönderi zaten teslim edilmiş');
    });

    it('iptal edilmiş gönderi için hata fırlatmalıdır', () => {
        // Arrange
        shipment.status = ShipmentStatus.CANCELLED;

        // Act & Assert
        expect(() => {
            shipment.completeDelivery(new Date(), 'test-user');
        }).toThrow('İptal edilmiş gönderi teslim edilemez');
    });

    it('gelecek tarihli teslimat için hata fırlatmalıdır', () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        // Act & Assert
        expect(() => {
            shipment.completeDelivery(futureDate, 'test-user');
        }).toThrow('Teslimat tarihi gelecekte olamaz');
    });
});

describe('isDeliverable', () => {
    it('OUT_FOR_DELIVERY status\'unda teslimat edilebilir olmalıdır', () => {
        // Arrange
        shipment.status = ShipmentStatus.OUT_FOR_DELIVERY;

        // Act
        const isDeliverable = shipment.isDeliverable();

        // Assert
        expect(isDeliverable).toBe(true);
    });

    it('AT_DELIVERY_GATE status\'unda teslimat edilebilir olmalıdır', () => {
        // Arrange
        shipment.status = ShipmentStatus.AT_DELIVERY_GATE;

        // Act
        const isDeliverable = shipment.isDeliverable();

        // Assert
        expect(isDeliverable).toBe(true);
    });

    it('CREATED status\'unda teslimat edilebilir olmamalıdır', () => {
        // Arrange
        shipment.status = ShipmentStatus.CREATED;

        // Act
        const isDeliverable = shipment.isDeliverable();

        // Assert
        expect(isDeliverable).toBe(false);
    });

    it('DELIVERED status\'unda teslimat edilebilir olmamalıdır', () => {
        // Arrange
        shipment.status = ShipmentStatus.DELIVERED;

        // Act
        const isDeliverable = shipment.isDeliverable();

        // Assert
        expect(isDeliverable).toBe(false);
    });
});

describe('getEstimatedDeliveryDays', () => {
    it('tahmini teslimat günlerini doğru hesaplamalıdır', () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        shipment.estimatedDeliveryDate = futureDate;

        // Act
        const days = shipment.getEstimatedDeliveryDays();

        // Assert
        expect(days).toBe(3);
    });

    it('geçmiş tarih için negatif gün döndürmelidir', () => {
        // Arrange
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 2);
        shipment.estimatedDeliveryDate = pastDate;

        // Act
        const days = shipment.getEstimatedDeliveryDays();

        // Assert
        expect(days).toBe(-2);
    });

    it('estimatedDeliveryDate null ise null döndürmelidir', () => {
        // Arrange
        shipment.estimatedDeliveryDate = null;

        // Act
        const days = shipment.getEstimatedDeliveryDays();

        // Assert
        expect(days).toBeNull();
    });

    it('bugün teslimat için 0 döndürmelidir', () => {
        // Arrange
        shipment.estimatedDeliveryDate = new Date();

        // Act
        const days = shipment.getEstimatedDeliveryDays();

        // Assert
        expect(days).toBe(0);
    });
});

describe('validation', () => {
    it('validateBusinessRules tüm geçerli bilgiler için başarılı olmalıdır', () => {
        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    it('geçersiz ağırlık için hata döndürmelidir', () => {
        // Arrange
        shipment.weight = -5;

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Ağırlık pozitif olmalıdır');
    });

    it('sıfır ağırlık için hata döndürmelidir', () => {
        // Arrange
        shipment.weight = 0;

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Ağırlık pozitif olmalıdır');
    });

    it('geçersiz boyutlar için hata döndürmelidir', () => {
        // Arrange
        shipment.length = -10;
        shipment.width = 0;
        shipment.height = -5;

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Boyutlar pozitif olmalıdır');
    });

    it('çok büyük boyutlar için hata döndürmelidir', () => {
        // Arrange
        shipment.length = 300; // >200cm

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Boyutlar makul sınırlar içinde olmalıdır');
    });

    it('çok ağır gönderi için hata döndürmelidir', () => {
        // Arrange
        shipment.weight = 1500; // >1000kg

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Ağırlık makul sınırlar içinde olmalıdır');
    });

    it('boş gönderici adı için hata döndürmelidir', () => {
        // Arrange
        shipment.senderName = '';

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Gönderici ve alıcı bilgileri gereklidir');
    });

    it('boş alıcı adı için hata döndürmelidir', () => {
        // Arrange
        shipment.receiverName = '';

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Gönderici ve alıcı bilgileri gereklidir');
    });

    it('multiple validation errors doğru şekilde toplamalıdır', () => {
        // Arrange
        shipment.weight = -1;
        shipment.length = -10;
        shipment.senderName = '';

        // Act
        const validation = shipment.validateBusinessRules();

        // Assert
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(1);
        expect(validation.errors).toContain('Ağırlık pozitif olmalıdır');
        expect(validation.errors).toContain('Boyutlar pozitif olmalıdır');
        expect(validation.errors).toContain('Gönderici ve alıcı bilgileri gereklidir');
    });
});
}); 