export declare class CreateShipmentCommand {
    readonly trackingNumber: string;
    readonly origin: string;
    readonly destination: string;
    readonly description?: string | undefined;
    readonly weight: number;
    readonly volume: number;
    readonly estimatedDeliveryDate?: Date | undefined;
    constructor(trackingNumber: string, origin: string, destination: string, description?: string | undefined, weight?: number, volume?: number, estimatedDeliveryDate?: Date | undefined);
}
