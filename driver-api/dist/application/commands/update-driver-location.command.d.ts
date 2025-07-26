export declare class UpdateDriverLocationCommand {
    readonly driverId: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly address?: string | undefined;
    readonly speed?: number | undefined;
    readonly heading?: number | undefined;
    constructor(driverId: string, latitude: number, longitude: number, address?: string | undefined, speed?: number | undefined, heading?: number | undefined);
}
