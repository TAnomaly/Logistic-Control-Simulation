import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { AssignShipmentCommand } from '../commands/assign-shipment.command';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmOutboxEventRepository } from '../../infrastructure/repositories/typeorm-outbox-event.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';
import { ShipmentAssignedEvent } from '../../domain/events/shipment-assigned.event';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';

@CommandHandler(AssignShipmentCommand)
export class AssignShipmentHandler implements ICommandHandler<AssignShipmentCommand> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository,
        private readonly outboxEventRepository: TypeOrmOutboxEventRepository,
        private readonly eventBus: EventBus
    ) { }

    async execute(command: AssignShipmentCommand): Promise<Shipment> {
        const shipment = await this.shipmentRepository.findById(command.shipmentId);
        if (!shipment) {
            throw new Error('Shipment not found');
        }

        // Assign driver and update status
        shipment.assignedDriverId = command.driverId;
        shipment.status = ShipmentStatus.ASSIGNED;

        const updatedShipment = await this.shipmentRepository.save(shipment);

        // Create domain event
        const event = new ShipmentAssignedEvent(
            updatedShipment.id,
            command.driverId,
            new Date()
        );

        // Store in outbox for reliable event publishing
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventType = 'ShipmentAssigned';
        outboxEvent.eventData = event;
        outboxEvent.status = OutboxEventStatus.PENDING;
        outboxEvent.routingKey = 'shipment.assigned';
        outboxEvent.exchange = 'logistics';

        await this.outboxEventRepository.save(outboxEvent);

        // Publish event locally
        this.eventBus.publish(event);

        return updatedShipment;
    }
} 