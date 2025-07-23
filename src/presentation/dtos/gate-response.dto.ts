import { Gate } from '../../domain/entities/gate.entity';
import { GateType } from '../../domain/value-objects/gate-type.vo';

/**
 * GateResponseDto - Gate entity'si için response DTO
 */
export class GateResponseDto {
    id: string;
    gateCode: string;
    name: string;
    gateType: GateType;
    locationName: string;
    address: string;
    latitude?: number;
    longitude?: number;
    isActive: boolean;
    hourlyCapacity?: number;
    operatingHoursStart?: string;
    operatingHoursEnd?: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(gate: Gate) {
        this.id = gate.id;
        this.gateCode = gate.gateCode;
        this.name = gate.name;
        this.gateType = gate.gateType;
        this.locationName = gate.locationName;
        this.address = gate.address;
        this.latitude = gate.latitude;
        this.longitude = gate.longitude;
        this.isActive = gate.isActive;
        this.hourlyCapacity = gate.hourlyCapacity;
        this.operatingHoursStart = gate.operatingHoursStart;
        this.operatingHoursEnd = gate.operatingHoursEnd;
        this.createdAt = gate.createdAt;
        this.updatedAt = gate.updatedAt;
    }

    /**
     * Gate'in coğrafi konumunu döner
     */
    getLocation(): { latitude?: number; longitude?: number } | null {
        if (this.latitude !== undefined && this.longitude !== undefined) {
            return {
                latitude: this.latitude,
                longitude: this.longitude
            };
        }
        return null;
    }

    /**
     * Çalışma saatlerini döner
     */
    getOperatingHours(): { start?: string; end?: string } | null {
        if (this.operatingHoursStart && this.operatingHoursEnd) {
            return {
                start: this.operatingHoursStart,
                end: this.operatingHoursEnd
            };
        }
        return null;
    }

    /**
     * Gate'in şu an çalışıp çalışmadığını kontrol eder
     */
    isCurrentlyOperating(): boolean {
        if (!this.isActive) {
            return false;
        }

        if (!this.operatingHoursStart || !this.operatingHoursEnd) {
            return true; // 7/24 çalışıyor
        }

        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

        return currentTime >= this.operatingHoursStart && currentTime <= this.operatingHoursEnd;
    }
} 