import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { AssignShipmentCommand } from '../commands/assign-shipment.command';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmOutboxEventRepository } from '../../infrastructure/repositories/typeorm-outbox-event.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
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

        const updatedShipment = await this.shipmentRepository.assignDriver(command.shipmentId, command.driverId);

        // Create domain event
        const event = new ShipmentAssignedEvent(
            updatedShipment.id,
            command.driverId,
            updatedShipment.updatedAt
        );

        // Save to outbox for reliable message delivery
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventType = 'ShipmentAssigned';
        outboxEvent.eventData = {
            shipmentId: event.shipmentId,
            driverId: event.driverId,
            assignedAt: event.assignedAt
        };
        outboxEvent.status = OutboxEventStatus.PENDING;
        outboxEvent.routingKey = 'shipment.assigned';
        outboxEvent.exchange = 'logistics';

        await this.outboxEventRepository.save(outboxEvent);

        // Also publish locally for immediate processing
        this.eventBus.publish(event);

        return updatedShipment;
    }
} 