import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateShipmentCommand } from '../commands/create-shipment.command';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmOutboxEventRepository } from '../../infrastructure/repositories/typeorm-outbox-event.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';
import { ShipmentCreatedEvent } from '../../domain/events/shipment-created.event';
import { OutboxEvent, OutboxEventStatus } from '../../../../shared/outbox/outbox-event.entity';

@CommandHandler(CreateShipmentCommand)
export class CreateShipmentHandler implements ICommandHandler<CreateShipmentCommand> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository,
        private readonly outboxEventRepository: TypeOrmOutboxEventRepository
    ) { }

    async execute(command: CreateShipmentCommand): Promise<Shipment> {
        const shipment = new Shipment();
        shipment.trackingNumber = command.trackingNumber;
        shipment.origin = command.origin;
        shipment.destination = command.destination;
        shipment.description = command.description || '';
        shipment.weight = command.weight;
        shipment.volume = command.volume;
        shipment.status = ShipmentStatus.PENDING;
        shipment.estimatedDeliveryDate = command.estimatedDeliveryDate || new Date();

        const savedShipment = await this.shipmentRepository.save(shipment);

        // Create domain event
        const event = new ShipmentCreatedEvent(
            savedShipment.id,
            savedShipment.trackingNumber,
            savedShipment.origin,
            savedShipment.destination,
            savedShipment.createdAt
        );

        // Save to outbox for reliable message delivery
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventType = 'ShipmentCreated';
        outboxEvent.eventData = {
            shipmentId: event.shipmentId,
            trackingNumber: event.trackingNumber,
            origin: event.origin,
            destination: event.destination,
            createdAt: event.createdAt
        };
        outboxEvent.status = OutboxEventStatus.PENDING;
        outboxEvent.routingKey = 'shipment.created';
        outboxEvent.exchange = 'logistics';

        await this.outboxEventRepository.save(outboxEvent);

        return savedShipment;
    }
} 