import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateShipmentCommand } from '../commands/create-shipment.command';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';
import { ShipmentCreatedEvent } from '../../domain/events/shipment-created.event';

@CommandHandler(CreateShipmentCommand)
export class CreateShipmentHandler implements ICommandHandler<CreateShipmentCommand> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository,
        private readonly eventBus: EventBus
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

        // Publish event
        this.eventBus.publish(new ShipmentCreatedEvent(
            savedShipment.id,
            savedShipment.trackingNumber,
            savedShipment.origin,
            savedShipment.destination,
            savedShipment.createdAt
        ));

        return savedShipment;
    }
} 