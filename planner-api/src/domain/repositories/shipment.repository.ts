import { Shipment, ShipmentStatus } from '../entities/shipment.entity';

export interface ShipmentRepository {
    save(shipment: Shipment): Promise<Shipment>;
    findById(id: string): Promise<Shipment | null>;
    findByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;
    findByStatus(status: ShipmentStatus): Promise<Shipment[]>;
    findAll(): Promise<Shipment[]>;
    delete(id: string): Promise<void>;
    updateStatus(id: string, status: ShipmentStatus): Promise<Shipment>;
} 