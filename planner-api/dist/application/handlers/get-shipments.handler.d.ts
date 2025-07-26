import { IQueryHandler } from '@nestjs/cqrs';
import { GetShipmentsQuery } from '../queries/get-shipments.query';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
export declare class GetShipmentsHandler implements IQueryHandler<GetShipmentsQuery> {
    private readonly shipmentRepository;
    constructor(shipmentRepository: ShipmentRepository);
    execute(query: GetShipmentsQuery): Promise<Shipment[]>;
}
