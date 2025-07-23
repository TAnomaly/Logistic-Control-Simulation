/**
 * GetTrackingEventsByGateQuery - Kapı ID'sine göre takip eventleri sorgulama
 */
export class GetTrackingEventsByGateQuery {
    constructor(
        public readonly gateId: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) { }
} 