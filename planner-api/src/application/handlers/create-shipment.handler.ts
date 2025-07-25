import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
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
        private readonly outboxEventRepository: TypeOrmOutboxEventRepository,
        private readonly eventBus: EventBus
    ) { }

    async execute(command: CreateShipmentCommand): Promise<Shipment> {
        // Create shipment
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
        const event = ShipmentCreatedEvent.fromShipment(savedShipment);

        // Store in outbox for reliable event publishing
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventType = 'ShipmentCreated';
        outboxEvent.eventData = event;
        outboxEvent.status = OutboxEventStatus.PENDING;
        outboxEvent.routingKey = 'shipment.created';
        outboxEvent.exchange = 'logistics';

        await this.outboxEventRepository.save(outboxEvent);

        // Publish event locally
        this.eventBus.publish(event);

        return savedShipment;
    }
} 