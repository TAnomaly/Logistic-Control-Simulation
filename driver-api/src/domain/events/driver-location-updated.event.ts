export class DriverLocationUpdatedEvent {
    constructor(
        public readonly driverId: string,
        public readonly latitude: number,
        public readonly longitude: number,
        public readonly address: string,
        public readonly timestamp: Date = new Date(),
    ) { }
} 