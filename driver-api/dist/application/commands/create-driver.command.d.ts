export declare class CreateDriverCommand {
    readonly name: string;
    readonly licenseNumber: string;
    readonly phoneNumber: string;
    readonly address?: string | undefined;
    constructor(name: string, licenseNumber: string, phoneNumber: string, address?: string | undefined);
}
