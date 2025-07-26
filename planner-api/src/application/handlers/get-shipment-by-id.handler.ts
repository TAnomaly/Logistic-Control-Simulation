import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetShipmentByIdQuery } from '../queries/get-shipment-by-id.query';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { Shipment } from '../../domain/entities/shipment.entity';

@QueryHandler(GetShipmentByIdQuery)
export class GetShipmentByIdHandler implements IQueryHandler<GetShipmentByIdQuery> {
    constructor(
        @Inject('ShipmentRepository')
        private readonly shipmentRepository: ShipmentRepository
    ) { }

    async execute(query: GetShipmentByIdQuery): Promise<Shipment | null> {
        return await this.shipmentRepository.findById(query.id);
    }
} 