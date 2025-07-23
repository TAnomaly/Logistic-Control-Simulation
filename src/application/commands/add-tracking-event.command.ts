import { TrackingEventType } from '../../domain/value-objects/tracking-event-type.vo';

/**
 * AddTrackingEventCommand - Yeni takip eventi ekleme komutu
 */
export class AddTrackingEventCommand {
    constructor(
        public readonly shipmentId: string,
        public readonly gateId: string,
        public readonly eventType: TrackingEventType,
        public readonly description?: string,
        public readonly processedBy?: string,
        public readonly processingDurationMinutes?: number,
        public readonly measuredWeight?: number,
        public readonly temperature?: number,
        public readonly humidity?: number,
        public readonly eventTimestamp: Date = new Date(),
    ) { }
} 