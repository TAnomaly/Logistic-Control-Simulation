import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';

@Injectable()
export class TypeOrmShipmentRepository {
    constructor(
        @InjectRepository(Shipment)
        private readonly repository: Repository<Shipment>
    ) { }

    async findByDriverId(driverId: string, status?: string): Promise<Shipment[]> {
        const queryBuilder = this.repository.createQueryBuilder('shipment')
            .where('shipment.assignedDriverId = :driverId', { driverId });

        if (status) {
            queryBuilder.andWhere('shipment.status = :status', { status });
        }

        return await queryBuilder.getMany();
    }

    async findById(id: string): Promise<Shipment | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async save(shipment: Shipment): Promise<Shipment> {
        return await this.repository.save(shipment);
    }

    async updateStatus(id: string, status: ShipmentStatus): Promise<void> {
        await this.repository.update(id, { status });
    }
} 