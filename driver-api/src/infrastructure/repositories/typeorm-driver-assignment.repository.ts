import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverAssignmentRepository } from '../../domain/repositories/driver-assignment.repository';
import { DriverAssignment, AssignmentStatus } from '../../domain/entities/driver-assignment.entity';

@Injectable()
export class TypeOrmDriverAssignmentRepository implements DriverAssignmentRepository {
    constructor(
        @InjectRepository(DriverAssignment)
        private readonly repository: Repository<DriverAssignment>
    ) { }

    async save(assignment: DriverAssignment): Promise<DriverAssignment> {
        return await this.repository.save(assignment);
    }

    async findByDriverId(driverId: string): Promise<DriverAssignment[]> {
        return await this.repository.find({
            where: { driverId },
            order: { assignedAt: 'DESC' }
        });
    }

    async findByShipmentId(shipmentId: string): Promise<DriverAssignment | null> {
        return await this.repository.findOne({
            where: { shipmentId }
        });
    }

    async findActiveByDriverId(driverId: string): Promise<DriverAssignment | null> {
        return await this.repository.findOne({
            where: {
                driverId,
                status: AssignmentStatus.IN_PROGRESS
            }
        });
    }

    async updateStatus(id: string, status: AssignmentStatus): Promise<DriverAssignment> {
        await this.repository.update(id, { status });
        const assignment = await this.repository.findOne({ where: { id } });
        if (!assignment) {
            throw new Error('Assignment not found');
        }
        return assignment;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
} 