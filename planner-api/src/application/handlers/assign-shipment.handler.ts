import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AssignShipmentCommand } from '../commands/assign-shipment.command';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { TypeOrmDriverAssignmentRepository } from '../../infrastructure/repositories/typeorm-driver-assignment.repository';
import { TypeOrmOutboxEventRepository } from '../../infrastructure/repositories/typeorm-outbox-event.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
import { DriverAssignment, AssignmentStatus } from '../../domain/entities/driver-assignment.entity';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';

@CommandHandler(AssignShipmentCommand)
export class AssignShipmentHandler implements ICommandHandler<AssignShipmentCommand> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository,
        private readonly driverAssignmentRepository: TypeOrmDriverAssignmentRepository,
        private readonly outboxEventRepository: TypeOrmOutboxEventRepository
    ) { }

    async execute(command: AssignShipmentCommand): Promise<Shipment> {
        console.log(`🚀 Assigning shipment ${command.shipmentId} to driver ${command.driverId}`);

        // Find the shipment
        const shipment = await this.shipmentRepository.findById(command.shipmentId);

        if (!shipment) {
            throw new Error(`Shipment not found: ${command.shipmentId}`);
        }

        // Create driver assignment
        const assignment = new DriverAssignment();
        assignment.driverId = command.driverId;
        assignment.shipmentId = command.shipmentId;
        assignment.status = AssignmentStatus.ASSIGNED;
        assignment.assignedAt = new Date();

        // Save the assignment
        const savedAssignment = await this.driverAssignmentRepository.save(assignment);
        console.log(`✅ Driver assignment created: ${savedAssignment.id}`);

        // Create outbox event for shipment assigned
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventType = 'ShipmentAssigned';
        outboxEvent.eventData = {
            shipmentId: command.shipmentId,
            driverId: command.driverId,
            assignmentId: savedAssignment.id,
            status: AssignmentStatus.ASSIGNED
        };
        outboxEvent.routingKey = 'shipment.assigned';
        outboxEvent.exchange = 'logistics.events';
        outboxEvent.status = OutboxEventStatus.PENDING;

        await this.outboxEventRepository.save(outboxEvent);
        console.log(`✅ Outbox event created for shipment assignment: ${savedAssignment.id}`);

        // Return the shipment (unchanged)
        return shipment;
    }
} 