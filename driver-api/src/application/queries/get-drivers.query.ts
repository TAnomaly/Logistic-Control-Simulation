import { DriverStatus } from '../../domain/entities/driver.entity';

export class GetDriversQuery {
    constructor(
        public readonly status?: DriverStatus,
        public readonly limit?: number,
        public readonly offset?: number
    ) { }
} 