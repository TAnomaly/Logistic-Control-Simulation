export class GetDriverShipmentsQuery {
    constructor(
        public readonly driverId: string,
        public readonly status?: string
    ) { }
} 