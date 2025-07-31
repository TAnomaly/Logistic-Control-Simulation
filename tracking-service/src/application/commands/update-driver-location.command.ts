import { Coordinates } from '../../domain/entities/driver-track.entity';

export class UpdateDriverLocationCommand {
    constructor(
        public readonly driverId: string,
        public readonly coordinates: Coordinates,
        public readonly timestamp: Date,
        public readonly speed?: number,
        public readonly heading?: number,
        public readonly accuracy?: number
    ) { }
} 