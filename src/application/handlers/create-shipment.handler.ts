import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CreateShipmentCommand } from '../commands/create-shipment.command';
import { Shipment } from '../../domain/entities/shipment.entity';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { ShipmentStatus } from '../../domain/value-objects/shipment-status.vo';
import { ShipmentCreatedEvent } from '../../domain/events/shipment-created.event';
import { v4 as uuidv4 } from 'uuid';

/**
 * CreateShipmentHandler - Yeni gönderi oluşturma komutunu işleyen handler
 * CQRS pattern'e göre command handling yapısını implemente eder
 */
@CommandHandler(CreateShipmentCommand)
@Injectable()
export class CreateShipmentHandler implements ICommandHandler<CreateShipmentCommand> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository,
        private readonly eventBus: EventBus,
    ) { }

    /**
     * Yeni gönderi oluşturma işlemini gerçekleştirir
     * @param command - Gönderi oluşturma komutu
     * @returns Oluşturulan gönderi entity'si
     */
    async execute(command: CreateShipmentCommand): Promise<Shipment> {
        // Benzersiz takip numarası oluştur
        const trackingNumber = this.generateTrackingNumber();

        // Yeni Shipment entity'si oluştur
        const shipment = new Shipment();
        shipment.id = uuidv4();
        shipment.trackingNumber = trackingNumber;
        shipment.senderName = command.senderName;
        shipment.senderAddress = command.senderAddress;
        shipment.receiverName = command.receiverName;
        shipment.receiverAddress = command.receiverAddress;
        shipment.status = ShipmentStatus.CREATED;
        shipment.weight = command.weight;
        shipment.length = command.length;
        shipment.width = command.width;
        shipment.height = command.height;
        shipment.estimatedDeliveryDate = command.estimatedDeliveryDate || null;
        shipment.createdAt = new Date();
        shipment.updatedAt = new Date();

        try {
            // Domain repository kullanarak veriyi persist et
            const savedShipment = await this.shipmentRepository.save(shipment);

            // Domain event'ini yayınla (Outbox pattern için)
            const shipmentCreatedEvent = new ShipmentCreatedEvent(
                savedShipment.id,
                savedShipment.trackingNumber,
                savedShipment.senderName,
                savedShipment.receiverName,
                savedShipment.weight,
                savedShipment.calculateVolume(),
            );

            // Event Bus ile domain event'ini publish et
            await this.eventBus.publish(shipmentCreatedEvent);

            return savedShipment;
        } catch (error) {
            // Repository katmanından gelen hataları yakala ve uygun hata fırlat
            throw new Error(`Gönderi oluşturulurken hata oluştu: ${error.message}`);
        }
    }

    /**
     * Benzersiz takip numarası oluşturur
     * Format: LCS-YYYYMMDD-XXXXXX (LCS: Logistic Control Simulation)
     */
    private generateTrackingNumber(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();

        return `LCS-${year}${month}${day}-${randomSuffix}`;
    }
} 