import { IQueryHandler } from '@nestjs/cqrs';
import { GetShipmentByIdQuery } from '../queries/get-shipment-by-id.query';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
export declare class GetShipmentByIdHandler implements IQueryHandler<GetShipmentByIdQuery> {
    private readonly shipmentRepository;
    constructor(shipmentRepository: ShipmentRepository);
    execute(query: GetShipmentByIdQuery): Promise<Shipment | null>;
}
