import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateShipmentCommand } from '../commands/create-shipment.command';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmOutboxEventRepository } from '../../infrastructure/repositories/typeorm-outbox-event.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';
import { ShipmentCreatedEvent } from '../../domain/events/shipment-created.event';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';

@CommandHandler(CreateShipmentCommand)
export class CreateShipmentHandler implements ICommandHandler<CreateShipmentCommand> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository,
        private readonly outboxEventRepository: TypeOrmOutboxEventRepository
    ) { }

    async execute(command: CreateShipmentCommand): Promise<Shipment> {
        console.log('🚀 Creating shipment with command:', command);

        const shipment = new Shipment();
        shipment.trackingNumber = command.trackingNumber;
        shipment.origin = command.origin;
        shipment.destination = command.destination;
        shipment.description = command.description || '';
        shipment.weight = command.weight;
        shipment.volume = command.volume;
        shipment.status = ShipmentStatus.PENDING;
        shipment.estimatedDeliveryDate = command.estimatedDeliveryDate || new Date();
        shipment.pickupLatitude = command.pickupLatitude ?? null;
        shipment.pickupLongitude = command.pickupLongitude ?? null;
        shipment.deliveryLatitude = command.deliveryLatitude ?? null;
        shipment.deliveryLongitude = command.deliveryLongitude ?? null;

        // Koordinatlar varsa mesafe hesapla
        if (command.pickupLatitude && command.pickupLongitude &&
            command.deliveryLatitude && command.deliveryLongitude) {
            const distance = this.calculateDistance(
                command.pickupLatitude, command.pickupLongitude,
                command.deliveryLatitude, command.deliveryLongitude
            );
            console.log(`📏 Calculated distance: ${distance.toFixed(2)} km`);
        }

        // Save the shipment
        const savedShipment = await this.shipmentRepository.save(shipment);
        console.log('✅ Shipment saved:', savedShipment.id);

        // Create outbox event for shipment created
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventType = 'ShipmentCreated';
        outboxEvent.eventData = {
            shipmentId: savedShipment.id,
            trackingNumber: savedShipment.trackingNumber,
            origin: savedShipment.origin,
            destination: savedShipment.destination
        };
        outboxEvent.routingKey = 'shipment.created';
        outboxEvent.exchange = 'logistics.events';
        outboxEvent.status = OutboxEventStatus.PENDING;

        await this.outboxEventRepository.save(outboxEvent);
        console.log('✅ Outbox event created for shipment:', savedShipment.id);

        return savedShipment;
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Dünya'nın yarıçapı (km)
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
} 