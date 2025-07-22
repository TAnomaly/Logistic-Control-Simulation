import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../../domain/entities/shipment.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentStatus } from '../../domain/value-objects/shipment-status.vo';

/**
 * TypeOrmShipmentRepository - ShipmentRepository interface'inin TypeORM implementasyonu
 * Infrastructure katmanında domain repository'sinin concrete implementasyonu
 */
@Injectable()
export class TypeOrmShipmentRepository implements ShipmentRepository {
    constructor(
        @InjectRepository(Shipment)
        private readonly repository: Repository<Shipment>,
    ) { }

    /**
     * Yeni bir gönderiyi kaydet
     */
    async save(shipment: Shipment): Promise<Shipment> {
        try {
            return await this.repository.save(shipment);
        } catch (error) {
            throw new Error(`Gönderi kaydedilirken hata oluştu: ${error.message}`);
        }
    }

    /**
     * ID'ye göre gönderi bul
     */
    async findById(id: string): Promise<Shipment | null> {
        try {
            const shipment = await this.repository.findOne({
                where: { id },
                relations: ['trackingEvents', 'trackingEvents.gate'], // İlişkili tracking events'leri de getir
            });
            return shipment || null;
        } catch (error) {
            throw new Error(`Gönderi ID ile aranırken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Takip numarasına göre gönderi bul
     */
    async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
        try {
            const shipment = await this.repository.findOne({
                where: { trackingNumber },
                relations: ['trackingEvents', 'trackingEvents.gate'], // İlişkili tracking events'leri de getir
                order: {
                    trackingEvents: {
                        eventTimestamp: 'ASC', // Tracking events'leri zamana göre sırala
                    },
                },
            });
            return shipment || null;
        } catch (error) {
            throw new Error(`Gönderi takip numarası ile aranırken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Tüm gönderileri getir (sayfalama ile)
     */
    async findAll(page: number, limit: number): Promise<{ shipments: Shipment[]; total: number }> {
        try {
            const skip = (page - 1) * limit;

            const [shipments, total] = await this.repository.findAndCount({
                relations: ['trackingEvents'],
                skip,
                take: limit,
                order: {
                    createdAt: 'DESC', // En yeni gönderiler önce
                },
            });

            return { shipments, total };
        } catch (error) {
            throw new Error(`Gönderiler listelenirken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Duruma göre gönderileri filtrele
     */
    async findByStatus(status: string, page: number, limit: number): Promise<{ shipments: Shipment[]; total: number }> {
        try {
            const skip = (page - 1) * limit;

            const [shipments, total] = await this.repository.findAndCount({
                where: { status: status as ShipmentStatus },
                relations: ['trackingEvents'],
                skip,
                take: limit,
                order: {
                    createdAt: 'DESC',
                },
            });

            return { shipments, total };
        } catch (error) {
            throw new Error(`Duruma göre gönderiler filtrelenirken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Gönderiyi güncelle
     */
    async update(shipment: Shipment): Promise<Shipment> {
        try {
            shipment.updatedAt = new Date();
            return await this.repository.save(shipment);
        } catch (error) {
            throw new Error(`Gönderi güncellenirken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Gönderiyi sil
     */
    async delete(id: string): Promise<void> {
        try {
            const result = await this.repository.delete(id);
            if (result.affected === 0) {
                throw new Error(`ID: ${id} ile gönderi bulunamadı`);
            }
        } catch (error) {
            throw new Error(`Gönderi silinirken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Alıcıya göre gönderileri bul
     */
    async findByReceiver(receiverName: string): Promise<Shipment[]> {
        try {
            return await this.repository.find({
                where: { receiverName },
                relations: ['trackingEvents'],
                order: {
                    createdAt: 'DESC',
                },
            });
        } catch (error) {
            throw new Error(`Alıcıya göre gönderiler aranırken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Göndericiye göre gönderileri bul
     */
    async findBySender(senderName: string): Promise<Shipment[]> {
        try {
            return await this.repository.find({
                where: { senderName },
                relations: ['trackingEvents'],
                order: {
                    createdAt: 'DESC',
                },
            });
        } catch (error) {
            throw new Error(`Göndericiye göre gönderiler aranırken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Tarih aralığına göre gönderileri bul
     */
    async findByDateRange(startDate: Date, endDate: Date): Promise<Shipment[]> {
        try {
            return await this.repository
                .createQueryBuilder('shipment')
                .leftJoinAndSelect('shipment.trackingEvents', 'trackingEvents')
                .where('shipment.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                })
                .orderBy('shipment.createdAt', 'DESC')
                .getMany();
        } catch (error) {
            throw new Error(`Tarih aralığına göre gönderiler aranırken hata oluştu: ${error.message}`);
        }
    }
} 