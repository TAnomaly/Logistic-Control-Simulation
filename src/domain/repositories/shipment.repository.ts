import { Shipment } from '../entities/shipment.entity';

/**
 * ShipmentRepository - Shipment entity'si için domain repository interface
 * Domain Driven Design pattern'e göre persistence katmanının soyutlaması
 */
export interface ShipmentRepository {
    /**
     * Yeni bir gönderiyi kaydet
     */
    save(shipment: Shipment): Promise<Shipment>;

    /**
     * ID'ye göre gönderi bul
     */
    findById(id: string): Promise<Shipment | null>;

    /**
     * Takip numarasına göre gönderi bul
     */
    findByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;

    /**
     * Tüm gönderileri getir (sayfalama ile)
     */
    findAll(page: number, limit: number): Promise<{ shipments: Shipment[]; total: number }>;

    /**
     * Duruma göre gönderileri filtrele
     */
    findByStatus(status: string, page: number, limit: number): Promise<{ shipments: Shipment[]; total: number }>;

    /**
     * Gönderiyi güncelle
     */
    update(shipment: Shipment): Promise<Shipment>;

    /**
     * Gönderiyi sil
     */
    delete(id: string): Promise<void>;

    /**
     * Alıcıya göre gönderileri bul
     */
    findByReceiver(receiverName: string): Promise<Shipment[]>;

    /**
     * Göndericiye göre gönderileri bul
     */
    findBySender(senderName: string): Promise<Shipment[]>;

    /**
     * Tarih aralığına göre gönderileri bul
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<Shipment[]>;
} 