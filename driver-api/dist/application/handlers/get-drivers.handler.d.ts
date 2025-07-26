import { IQueryHandler } from '@nestjs/cqrs';
import { GetDriversQuery } from '../queries/get-drivers.query';
import { DriverRepository } from '../../domain/repositories/driver.repository';
import { Driver } from '../../domain/entities/driver.entity';
export declare class GetDriversHandler implements IQueryHandler<GetDriversQuery> {
    private readonly driverRepository;
    constructor(driverRepository: DriverRepository);
    execute(query: GetDriversQuery): Promise<Driver[]>;
}
