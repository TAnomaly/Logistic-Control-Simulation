import { DriverStatus } from '../../domain/entities/driver.entity';
export declare class GetDriversQuery {
    readonly status?: DriverStatus | undefined;
    readonly limit?: number | undefined;
    readonly offset?: number | undefined;
    constructor(status?: DriverStatus | undefined, limit?: number | undefined, offset?: number | undefined);
}
