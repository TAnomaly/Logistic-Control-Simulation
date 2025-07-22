import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GetShipmentByTrackingQuery } from '../queries/get-shipment-by-tracking.query';
import { Shipment } from '../../domain/entities/shipment.entity';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';

/**
 * Gönderi tracking detayları için read model DTO
 */
export class ShipmentTrackingDetailsDto {
    id: string;
    trackingNumber: string;
    senderName: string;
    senderAddress: string;
    receiverName: string;
    receiverAddress: string;
    status: string;
    weight: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
        volume: number;
    };
    estimatedDeliveryDate: Date | null;
    actualDeliveryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    trackingEvents: TrackingEventSummaryDto[];

    constructor(shipment: Shipment) {
        this.id = shipment.id;
        this.trackingNumber = shipment.trackingNumber;
        this.senderName = shipment.senderName;
        this.senderAddress = shipment.senderAddress;
        this.receiverName = shipment.receiverName;
        this.receiverAddress = shipment.receiverAddress;
        this.status = shipment.status;
        this.weight = shipment.weight;
        this.dimensions = {
            length: shipment.length,
            width: shipment.width,
            height: shipment.height,
            volume: shipment.calculateVolume(),
        };
        this.estimatedDeliveryDate = shipment.estimatedDeliveryDate;
        this.actualDeliveryDate = shipment.actualDeliveryDate;
        this.createdAt = shipment.createdAt;
        this.updatedAt = shipment.updatedAt;
        this.trackingEvents = shipment.trackingEvents?.map(event => new TrackingEventSummaryDto(event)) || [];
    }
}

/**
 * Tracking event özeti için DTO
 */
export class TrackingEventSummaryDto {
    eventType: string;
    eventTimestamp: Date;
    description: string;
    gateName: string;
    gateLocation: string;

    constructor(trackingEvent: any) { // TrackingEvent type will be available after creating the entity
        this.eventType = trackingEvent.eventType;
        this.eventTimestamp = trackingEvent.eventTimestamp;
        this.description = trackingEvent.description || '';
        this.gateName = trackingEvent.gate?.name || 'Bilinmiyor';
        this.gateLocation = trackingEvent.gate?.locationName || 'Bilinmiyor';
    }
}

/**
 * GetShipmentByTrackingHandler - Takip numarasına göre gönderi sorgusunu işleyen handler
 * CQRS pattern'e göre query handling yapısını implemente eder
 */
@QueryHandler(GetShipmentByTrackingQuery)
@Injectable()
export class GetShipmentByTrackingHandler implements IQueryHandler<GetShipmentByTrackingQuery> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository
    ) { }

    /**
     * Takip numarasına göre gönderi bilgilerini getirir
     * @param query - Gönderi takip sorgusu
     * @returns Gönderi detayları DTO'su
     */
    async execute(query: GetShipmentByTrackingQuery): Promise<ShipmentTrackingDetailsDto> {
        try {
            // Repository'den gönderiyi ve tracking events'lerini getir
            const shipment = await this.shipmentRepository.findByTrackingNumber(query.trackingNumber);

            if (!shipment) {
                throw new NotFoundException(
                    `Takip numarası '${query.trackingNumber}' ile gönderi bulunamadı`
                );
            }

            // Domain entity'sini read model DTO'suna dönüştür
            return new ShipmentTrackingDetailsDto(shipment);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new Error(`Gönderi bilgileri alınırken hata oluştu: ${error.message}`);
        }
    }
} 