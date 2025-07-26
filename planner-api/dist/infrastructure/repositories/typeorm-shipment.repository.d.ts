import { Repository } from 'typeorm';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';
export declare class TypeOrmShipmentRepository implements ShipmentRepository {
    private readonly repository;
    constructor(repository: Repository<Shipment>);
    save(shipment: Shipment): Promise<Shipment>;
    findById(id: string): Promise<Shipment | null>;
    findByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;
    findByStatus(status: ShipmentStatus): Promise<Shipment[]>;
    findByDriverId(driverId: string): Promise<Shipment[]>;
    findAll(): Promise<Shipment[]>;
    delete(id: string): Promise<void>;
    updateStatus(id: string, status: ShipmentStatus): Promise<Shipment>;
    assignDriver(id: string, driverId: string): Promise<Shipment>;
}
