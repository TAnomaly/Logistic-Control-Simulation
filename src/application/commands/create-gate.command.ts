import { GateType } from '../../domain/value-objects/gate-type.vo';

/**
 * CreateGateCommand - Yeni kapı oluşturma komutu
 */
export class CreateGateCommand {
    constructor(
        public readonly gateCode: string,
        public readonly name: string,
        public readonly gateType: GateType,
        public readonly locationName: string,
        public readonly address: string,
        public readonly latitude?: number,
        public readonly longitude?: number,
        public readonly hourlyCapacity?: number,
        public readonly operatingHoursStart?: string,
        public readonly operatingHoursEnd?: string,
    ) { }
} 