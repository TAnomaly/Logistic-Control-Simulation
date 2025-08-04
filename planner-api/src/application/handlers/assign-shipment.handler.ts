import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AssignShipmentCommand } from '../commands/assign-shipment.command';
import { Shipment } from '../../domain/entities/shipment.entity';

@CommandHandler(AssignShipmentCommand)
export class AssignShipmentHandler implements ICommandHandler<AssignShipmentCommand> {
    constructor() { }

    async execute(command: AssignShipmentCommand): Promise<Shipment> {
        // For now, just log the assignment
        console.log(`Assigning shipment ${command.shipmentId} to driver ${command.driverId}`);

        // Return a mock shipment
        const shipment = new Shipment();
        shipment.id = command.shipmentId;
        shipment.assignedDriverId = command.driverId;
        return shipment;
    }
} 