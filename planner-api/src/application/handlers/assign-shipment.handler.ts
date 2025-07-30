import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { AssignShipmentCommand } from '../commands/assign-shipment.command';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
import { ShipmentAssignedEvent } from '../../domain/events/shipment-assigned.event';

@CommandHandler(AssignShipmentCommand)
export class AssignShipmentHandler implements ICommandHandler<AssignShipmentCommand> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository,
        private readonly eventBus: EventBus
    ) { }

    async execute(command: AssignShipmentCommand): Promise<Shipment> {
        const shipment = await this.shipmentRepository.findById(command.shipmentId);
        if (!shipment) {
            throw new Error('Shipment not found');
        }

        const updatedShipment = await this.shipmentRepository.assignDriver(command.shipmentId, command.driverId);

        // Publish event
        this.eventBus.publish(new ShipmentAssignedEvent(
            updatedShipment.id,
            command.driverId,
            updatedShipment.updatedAt
        ));

        return updatedShipment;
    }
} 