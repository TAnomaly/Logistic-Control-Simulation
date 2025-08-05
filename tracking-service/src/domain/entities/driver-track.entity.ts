export class Coordinates {
    constructor(
        public readonly latitude: number,
        public readonly longitude: number
    ) { }
}

export class DriverLocation {
    constructor(
        public readonly driverId: string,
        public readonly coordinates: Coordinates,
        public readonly timestamp: Date,
        public readonly speed?: number,
        public readonly heading?: number,
        public readonly accuracy?: number
    ) { }
}

export class DriverPolyline {
    constructor(
        public readonly driverId: string,
        public readonly locations: DriverLocation[],
        public readonly totalDistance: number,
        public readonly startTime: Date,
        public readonly lastUpdateTime: Date,
        public readonly isActive: boolean
    ) { }

    addLocation(location: DriverLocation): DriverPolyline {
        const newLocations = [...this.locations, location];
        const newTotalDistance = this.calculateTotalDistance(newLocations);

        return new DriverPolyline(
            this.driverId,
            newLocations,
            newTotalDistance,
            this.startTime,
            location.timestamp,
            true
        );
    }

    private calculateTotalDistance(locations: DriverLocation[]): number {
        if (locations.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < locations.length; i++) {
            totalDistance += this.calculateDistance(
                locations[i - 1].coordinates,
                locations[i].coordinates
            );
        }
        return totalDistance;
    }

    private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(coord2.latitude - coord1.latitude);
        const dLng = this.toRadians(coord2.longitude - coord1.longitude);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(this.toRadians(coord1.latitude)) *
            Math.cos(this.toRadians(coord2.latitude)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.asin(Math.sqrt(a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    getPolylineString(): string {
        return this.locations
            .map(location => `${location.coordinates.latitude},${location.coordinates.longitude}`)
            .join('|');
    }

    getCurrentLocation(): DriverLocation | null {
        return this.locations.length > 0 ? this.locations[this.locations.length - 1] : null;
    }

    getDuration(): number {
        return this.lastUpdateTime.getTime() - this.startTime.getTime();
    }

    getAverageSpeed(): number {
        const duration = this.getDuration();
        if (duration === 0) return 0;
        return (this.totalDistance / duration) * 3600000; // km/h
    }

    /**
     * Basit H3 grid analizi
     */
    getH3Grid(): string[] {
        return this.locations.map(location =>
            `${Math.round(location.coordinates.latitude * 1000)},${Math.round(location.coordinates.longitude * 1000)}`
        );
    }

    /**
     * Rota verimliliği (basit hesaplama)
     */
    getRouteEfficiency(): number {
        if (this.locations.length < 2) return 0;

        const start = this.locations[0];
        const end = this.locations[this.locations.length - 1];
        const straightDistance = this.calculateDistance(start.coordinates, end.coordinates);

        return straightDistance / this.totalDistance;
    }
}

export class ActiveDriver {
    constructor(
        public readonly driverId: string,
        public readonly name: string,
        public readonly licenseNumber: string,
        public readonly currentLocation: DriverLocation,
        public readonly polyline: DriverPolyline,
        public readonly status: DriverStatus,
        public readonly lastActiveAt: Date
    ) { }
}

export enum DriverStatus {
    AVAILABLE = 'available',
    BUSY = 'busy',
    OFFLINE = 'offline',
    DELIVERING = 'delivering'
} 