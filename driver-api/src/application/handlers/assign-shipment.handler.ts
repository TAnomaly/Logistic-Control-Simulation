import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AssignShipmentCommand } from '../commands/assign-shipment.command';
import { TypeOrmDriverAssignmentRepository } from '../../infrastructure/repositories/typeorm-driver-assignment.repository';
import { DriverAssignment, AssignmentStatus } from '../../domain/entities/driver-assignment.entity';

@CommandHandler(AssignShipmentCommand)
export class AssignShipmentHandler implements ICommandHandler<AssignShipmentCommand> {
    constructor(
        private readonly driverAssignmentRepository: TypeOrmDriverAssignmentRepository,
        private readonly eventBus: EventBus,
    ) { }

    async execute(command: AssignShipmentCommand): Promise<void> {
        const { driverId, shipmentId, estimatedDuration, notes } = command;

        // Create new assignment
        const assignment = new DriverAssignment();
        assignment.driverId = driverId;
        assignment.shipmentId = shipmentId;
        assignment.status = AssignmentStatus.PENDING;
        assignment.assignedAt = new Date();
        assignment.estimatedDuration = estimatedDuration ?? null;
        assignment.notes = notes ?? null;

        await this.driverAssignmentRepository.save(assignment);

        console.log(`🚚 Shipment ${shipmentId} assigned to driver ${driverId}`);
    }
} 