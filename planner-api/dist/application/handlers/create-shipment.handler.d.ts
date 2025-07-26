import { ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateShipmentCommand } from '../commands/create-shipment.command';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
export declare class CreateShipmentHandler implements ICommandHandler<CreateShipmentCommand> {
    private readonly shipmentRepository;
    private readonly outboxEventRepository;
    private readonly eventBus;
    constructor(shipmentRepository: ShipmentRepository, outboxEventRepository: OutboxEventRepository, eventBus: EventBus);
    execute(command: CreateShipmentCommand): Promise<Shipment>;
}
