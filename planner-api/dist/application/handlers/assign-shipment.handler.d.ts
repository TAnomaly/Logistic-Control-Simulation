import { ICommandHandler, EventBus } from '@nestjs/cqrs';
import { AssignShipmentCommand } from '../commands/assign-shipment.command';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
export declare class AssignShipmentHandler implements ICommandHandler<AssignShipmentCommand> {
    private readonly shipmentRepository;
    private readonly outboxEventRepository;
    private readonly eventBus;
    constructor(shipmentRepository: ShipmentRepository, outboxEventRepository: OutboxEventRepository, eventBus: EventBus);
    execute(command: AssignShipmentCommand): Promise<Shipment>;
}
