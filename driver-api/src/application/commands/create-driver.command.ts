export class CreateDriverCommand {
    constructor(
        public readonly name: string,
        public readonly licenseNumber: string,
        public readonly phoneNumber: string,
        public readonly address?: string
    ) { }
} 