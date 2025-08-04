import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetShipmentsQuery } from '../queries/get-shipments.query';
import { Shipment } from '../../domain/entities/shipment.entity';

@QueryHandler(GetShipmentsQuery)
export class GetShipmentsHandler implements IQueryHandler<GetShipmentsQuery> {
    constructor() { }

    async execute(query: GetShipmentsQuery): Promise<Shipment[]> {
        // For now, return empty array
        console.log('Getting all shipments');
        return [];
    }
} 