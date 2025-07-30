import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetShipmentsQuery } from '../queries/get-shipments.query';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity';

@QueryHandler(GetShipmentsQuery)
export class GetShipmentsHandler implements IQueryHandler<GetShipmentsQuery> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository
    ) { }

    async execute(query: GetShipmentsQuery): Promise<Shipment[]> {
        if (query.status && query.driverId) {
            // Filter by both status and driverId
            const shipments = await this.shipmentRepository.findByStatus(query.status);
            return shipments.filter(s => s.assignedDriverId === query.driverId);
        } else if (query.status) {
            return await this.shipmentRepository.findByStatus(query.status);
        } else if (query.driverId) {
            return await this.shipmentRepository.findByDriverId(query.driverId);
        } else {
            return await this.shipmentRepository.findAll();
        }
    }
} 