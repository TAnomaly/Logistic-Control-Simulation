import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverAssignment, AssignmentStatus } from '../../domain/entities/driver-assignment.entity';

@Injectable()
export class TypeOrmDriverAssignmentRepository {
    constructor(
        @InjectRepository(DriverAssignment)
        private readonly repository: Repository<DriverAssignment>
    ) { }

    async save(assignment: DriverAssignment): Promise<DriverAssignment> {
        return await this.repository.save(assignment);
    }

    async findById(id: string): Promise<DriverAssignment | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findByDriverId(driverId: string): Promise<DriverAssignment[]> {
        return await this.repository.find({ where: { driverId } });
    }

    async findByShipmentId(shipmentId: string): Promise<DriverAssignment[]> {
        return await this.repository.find({ where: { shipmentId } });
    }

    async findByStatus(status: AssignmentStatus): Promise<DriverAssignment[]> {
        return await this.repository.find({ where: { status } });
    }

    async findAll(): Promise<DriverAssignment[]> {
        return await this.repository.find();
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async updateStatus(id: string, status: AssignmentStatus): Promise<DriverAssignment> {
        await this.repository.update(id, { status });
        const assignment = await this.findById(id);
        if (!assignment) {
            throw new Error('Driver assignment not found');
        }
        return assignment;
    }
} 