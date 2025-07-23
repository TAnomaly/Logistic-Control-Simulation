/**
 * GetTrackingEventsByShipmentQuery - Gönderi ID'sine göre takip eventleri sorgulama
 */
export class GetTrackingEventsByShipmentQuery {
    constructor(
        public readonly shipmentId: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) { }
} 