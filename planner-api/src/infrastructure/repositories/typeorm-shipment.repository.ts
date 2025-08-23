import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';

@Injectable()
export class TypeOrmShipmentRepository implements ShipmentRepository {
    constructor(
        @InjectRepository(Shipment)
        private readonly repository: Repository<Shipment>
    ) { }

    async save(shipment: Shipment): Promise<Shipment> {
        return await this.repository.save(shipment);
    }

    async findById(id: string): Promise<Shipment | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
        return await this.repository.findOne({ where: { trackingNumber } });
    }

    async findByStatus(status: ShipmentStatus): Promise<Shipment[]> {
        return await this.repository.find({ where: { status } });
    }

    async findAll(): Promise<Shipment[]> {
        return await this.repository.find();
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async updateStatus(id: string, status: ShipmentStatus): Promise<Shipment> {
        await this.repository.update(id, { status });
        const shipment = await this.findById(id);
        if (!shipment) {
            throw new Error('Shipment not found');
        }
        return shipment;
    }
} 