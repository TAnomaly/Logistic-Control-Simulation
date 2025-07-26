export class UpdateDriverLocationCommand {
    constructor(
        public readonly driverId: string,
        public readonly latitude: number,
        public readonly longitude: number,
        public readonly address?: string,
        public readonly speed?: number,
        public readonly heading?: number
    ) { }
} 