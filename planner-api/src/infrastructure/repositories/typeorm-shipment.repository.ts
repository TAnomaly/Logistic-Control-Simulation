import { Injectable } from '@nestjs/common';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';

@Injectable()
export class TypeOrmShipmentRepository implements ShipmentRepository {
    private shipments: Shipment[] = [];

    constructor() { }

    async save(shipment: Shipment): Promise<Shipment> {
        if (!shipment.id) {
            shipment.id = Math.random().toString(36).substr(2, 9);
            shipment.createdAt = new Date();
        }
        shipment.updatedAt = new Date();

        const existingIndex = this.shipments.findIndex(s => s.id === shipment.id);
        if (existingIndex >= 0) {
            this.shipments[existingIndex] = shipment;
        } else {
            this.shipments.push(shipment);
        }

        return shipment;
    }

    async findById(id: string): Promise<Shipment | null> {
        return this.shipments.find(s => s.id === id) || null;
    }

    async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
        return this.shipments.find(s => s.trackingNumber === trackingNumber) || null;
    }

    async findByStatus(status: ShipmentStatus): Promise<Shipment[]> {
        return this.shipments.filter(s => s.status === status);
    }

    async findByDriverId(driverId: string): Promise<Shipment[]> {
        return this.shipments.filter(s => s.assignedDriverId === driverId);
    }

    async findAll(): Promise<Shipment[]> {
        return [...this.shipments];
    }

    async delete(id: string): Promise<void> {
        this.shipments = this.shipments.filter(s => s.id !== id);
    }

    async updateStatus(id: string, status: ShipmentStatus): Promise<Shipment> {
        const shipment = await this.findById(id);
        if (!shipment) {
            throw new Error('Shipment not found');
        }
        shipment.status = status;
        shipment.updatedAt = new Date();
        return shipment;
    }

    async assignDriver(id: string, driverId: string): Promise<Shipment> {
        const shipment = await this.findById(id);
        if (!shipment) {
            throw new Error('Shipment not found');
        }
        shipment.assignedDriverId = driverId;
        shipment.status = ShipmentStatus.ASSIGNED;
        shipment.updatedAt = new Date();
        return shipment;
    }
} 