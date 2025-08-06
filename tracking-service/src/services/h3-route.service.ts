import { Injectable } from '@nestjs/common';
import { latLngToCell, cellToLatLng, gridDisk, cellToBoundary } from 'h3-js';

export interface Location {
    lat: number;
    lng: number;
}

export interface ShipmentLocation {
    shipmentId: string;
    trackingNumber: string;
    pickup: Location;
    delivery: Location;
}

export interface OptimizedRoute {
    driverId: string;
    route: {
        polyline: string; // H3 polyline encoded route
        waypoints: Array<{
            latitude: number;
            longitude: number;
            h3Index: string;
            shipmentId?: string;
            type: 'pickup' | 'delivery' | 'waypoint';
        }>;
        totalDistance: number; // meters
        totalDuration: number; // seconds
        optimizedOrder: string[]; // shipment ID'lerin optimize edilmiş sırası
    };
    shipments: Array<{
        shipmentId: string;
        trackingNumber: string;
        pickupLatitude: number;
        pickupLongitude: number;
        deliveryLatitude: number;
        deliveryLongitude: number;
        order: number; // route'daki sırası
    }>;
    createdAt: Date;
}

export interface Route {
    driverId: string;
    startLocation: Location;
    endLocation: Location;
    h3Path: string[];
    polyline: Location[];
    distance: number;
    estimatedTime: number;
    waypoints: Location[];
    createdAt: Date;
}

@Injectable()
export class H3RouteService {
    private readonly RESOLUTION = 7; // Şehir seviyesi çözünürlük

    // Türkiye şehir koordinatları
    private readonly TURKEY_CITIES = {
        'Istanbul': { lat: 41.0082, lng: 28.9784 },
        'Ankara': { lat: 39.9334, lng: 32.8597 },
        'Izmir': { lat: 38.4192, lng: 27.1287 },
        'Antalya': { lat: 36.8969, lng: 30.7133 },
        'Bursa': { lat: 40.1885, lng: 29.0610 },
        'Adana': { lat: 37.0000, lng: 35.3213 },
        'Konya': { lat: 37.8667, lng: 32.4833 },
        'Gaziantep': { lat: 37.0662, lng: 37.3833 },
        'Mersin': { lat: 36.8000, lng: 34.6333 },
        'Diyarbakir': { lat: 37.9144, lng: 40.2306 }
    };

    /**
     * Driver için optimize edilmiş rota hesaplama (TSP - Traveling Salesman Problem)
     */
    async calculateOptimizedRoute(
        driverId: string,
        shipments: ShipmentLocation[],
        startLocation?: Location
    ): Promise<OptimizedRoute> {
        console.log(`🚗 Driver ${driverId} için optimize rota hesaplanıyor`);
        console.log(`📦 ${shipments.length} shipment optimize edilecek`);

        if (shipments.length === 0) {
            throw new Error('Shipment listesi boş olamaz!');
        }

        // Tüm noktaları topla (pickup + delivery)
        const allPoints: Array<{
            location: Location;
            type: 'pickup' | 'delivery';
            shipmentId: string;
            trackingNumber: string;
        }> = [];

        shipments.forEach(shipment => {
            allPoints.push({
                location: shipment.pickup,
                type: 'pickup',
                shipmentId: shipment.shipmentId,
                trackingNumber: shipment.trackingNumber
            });
            allPoints.push({
                location: shipment.delivery,
                type: 'delivery',
                shipmentId: shipment.shipmentId,
                trackingNumber: shipment.trackingNumber
            });
        });

        // Başlangıç noktasını belirle
        const startPoint = startLocation || allPoints[0].location;

        // TSP algoritması ile optimize edilmiş sırayı hesapla
        const optimizedOrder = this.solveTSP(startPoint, allPoints);

        // Optimize edilmiş sıraya göre polyline oluştur
        const polyline = this.createOptimizedPolyline(optimizedOrder);

        // Waypoint'leri hesapla
        const waypoints = this.createWaypoints(optimizedOrder);

        // Toplam mesafe ve süre hesapla
        const totalDistance = this.calculateTotalDistance(polyline);
        const totalDuration = this.estimateTravelTime(totalDistance);

        // Shipment'ları optimize edilmiş sıraya göre düzenle
        const optimizedShipments = this.createOptimizedShipments(shipments, optimizedOrder);

        const optimizedRoute: OptimizedRoute = {
            driverId,
            route: {
                polyline: this.encodePolyline(polyline),
                waypoints,
                totalDistance,
                totalDuration,
                optimizedOrder: optimizedOrder.map(point => point.shipmentId)
            },
            shipments: optimizedShipments,
            createdAt: new Date()
        };

        console.log(`✅ Optimize rota hesaplandı: ${totalDistance.toFixed(2)} km, ${totalDuration} dakika`);
        console.log(`📋 Optimize edilmiş sıra: ${optimizedOrder.map(p => p.shipmentId).join(' → ')}`);

        return optimizedRoute;
    }

    /**
     * TSP (Traveling Salesman Problem) çözümü - Basit sıralama
     */
    private solveTSP(
        startPoint: Location,
        points: Array<{
            location: Location;
            type: 'pickup' | 'delivery';
            shipmentId: string;
            trackingNumber: string;
        }>
    ): Array<{
        location: Location;
        type: 'pickup' | 'delivery';
        shipmentId: string;
        trackingNumber: string;
    }> {
        // Basit sıralama: pickup'ları önce, delivery'leri sonra
        const pickupPoints = points.filter(p => p.type === 'pickup');
        const deliveryPoints = points.filter(p => p.type === 'delivery');

        return [...pickupPoints, ...deliveryPoints];
    }

    /**
     * Optimize edilmiş polyline oluştur
     */
    private createOptimizedPolyline(
        optimizedOrder: Array<{
            location: Location;
            type: 'pickup' | 'delivery';
            shipmentId: string;
            trackingNumber: string;
        }>
    ): Location[] {
        const polyline: Location[] = [];

        for (let i = 0; i < optimizedOrder.length; i++) {
            const current = optimizedOrder[i];
            polyline.push(current.location);

            // Eğer sonraki nokta varsa, basit düz çizgi ekle
            if (i < optimizedOrder.length - 1) {
                const next = optimizedOrder[i + 1];
                // Basit interpolasyon: 5 ara nokta ekle
                for (let j = 1; j <= 5; j++) {
                    const ratio = j / 6;
                    const lat = current.location.lat + (next.location.lat - current.location.lat) * ratio;
                    const lng = current.location.lng + (next.location.lng - current.location.lng) * ratio;
                    polyline.push({ lat, lng });
                }
            }
        }

        return polyline;
    }

    /**
     * Waypoint'leri oluştur
     */
    private createWaypoints(
        optimizedOrder: Array<{
            location: Location;
            type: 'pickup' | 'delivery';
            shipmentId: string;
            trackingNumber: string;
        }>
    ): Array<{
        latitude: number;
        longitude: number;
        h3Index: string;
        shipmentId?: string;
        type: 'pickup' | 'delivery' | 'waypoint';
    }> {
        const waypoints: Array<{
            latitude: number;
            longitude: number;
            h3Index: string;
            shipmentId?: string;
            type: 'pickup' | 'delivery' | 'waypoint';
        }> = [];

        optimizedOrder.forEach((point, index) => {
            waypoints.push({
                latitude: point.location.lat,
                longitude: point.location.lng,
                h3Index: latLngToCell(point.location.lat, point.location.lng, this.RESOLUTION),
                shipmentId: point.shipmentId,
                type: point.type
            });
        });

        return waypoints;
    }

    /**
     * Optimize edilmiş shipment listesi oluştur
     */
    private createOptimizedShipments(
        shipments: ShipmentLocation[],
        optimizedOrder: Array<{
            location: Location;
            type: 'pickup' | 'delivery';
            shipmentId: string;
            trackingNumber: string;
        }>
    ): Array<{
        shipmentId: string;
        trackingNumber: string;
        pickupLatitude: number;
        pickupLongitude: number;
        deliveryLatitude: number;
        deliveryLongitude: number;
        order: number;
    }> {
        const shipmentMap = new Map<string, ShipmentLocation>();
        shipments.forEach(s => shipmentMap.set(s.shipmentId, s));

        const result: Array<{
            shipmentId: string;
            trackingNumber: string;
            pickupLatitude: number;
            pickupLongitude: number;
            deliveryLatitude: number;
            deliveryLongitude: number;
            order: number;
        }> = [];

        let order = 0;
        const processedShipments = new Set<string>();

        optimizedOrder.forEach(point => {
            if (!processedShipments.has(point.shipmentId)) {
                const shipment = shipmentMap.get(point.shipmentId);
                if (shipment) {
                    result.push({
                        shipmentId: shipment.shipmentId,
                        trackingNumber: shipment.trackingNumber,
                        pickupLatitude: shipment.pickup.lat,
                        pickupLongitude: shipment.pickup.lng,
                        deliveryLatitude: shipment.delivery.lat,
                        deliveryLongitude: shipment.delivery.lng,
                        order: order++
                    });
                    processedShipments.add(point.shipmentId);
                }
            }
        });

        return result;
    }

    /**
     * Polyline'ı encode et (Google Polyline Algorithm)
     */
    encodePolyline(points: Location[]): string {
        let encoded = '';
        let lastLat = 0;
        let lastLng = 0;

        for (const point of points) {
            const lat = Math.round(point.lat * 1e5);
            const lng = Math.round(point.lng * 1e5);

            const dLat = lat - lastLat;
            const dLng = lng - lastLng;

            encoded += this.encodeNumber(dLat);
            encoded += this.encodeNumber(dLng);

            lastLat = lat;
            lastLng = lng;
        }

        return encoded;
    }

    /**
     * Polyline'ı decode et (Google Polyline Algorithm)
     */
    decodePolyline(encoded: string): Location[] {
        const points: Location[] = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < encoded.length) {
            const dLat = this.decodeNumber(encoded, index);
            index = dLat.index;
            lat += dLat.value;

            const dLng = this.decodeNumber(encoded, index);
            index = dLng.index;
            lng += dLng.value;

            points.push({
                lat: lat / 1e5,
                lng: lng / 1e5
            });
        }

        return points;
    }

    /**
     * Polyline'dan sayı decode et
     */
    private decodeNumber(encoded: string, index: number): { value: number; index: number } {
        let result = 0;
        let shift = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const value = ((result & 1) ? ~(result >> 1) : (result >> 1));
        return { value, index };
    }

    /**
     * Sayıyı polyline formatında encode et
     */
    private encodeNumber(num: number): string {
        let encoded = '';
        let value = num < 0 ? ~(num << 1) : (num << 1);

        while (value >= 0x20) {
            encoded += String.fromCharCode(((value & 0x1f) | 0x20) + 63);
            value >>= 5;
        }

        encoded += String.fromCharCode(value + 63);
        return encoded;
    }

    /**
     * H3 algoritması ile rota hesaplama (tek nokta için)
     */
    async calculateRoute(
        driverId: string,
        start: Location,
        end: Location
    ): Promise<Route> {
        console.log(`🚗 H3 rota hesaplanıyor: ${driverId}`);
        console.log(`📍 Başlangıç: ${start.lat}, ${start.lng}`);
        console.log(`🎯 Hedef: ${end.lat}, ${end.lng}`);

        // Başlangıç ve bitiş H3 hücreleri
        const startCell = latLngToCell(start.lat, start.lng, this.RESOLUTION);
        const endCell = latLngToCell(end.lat, end.lng, this.RESOLUTION);

        console.log(`🏗️ H3 Başlangıç hücresi: ${startCell}`);
        console.log(`🏗️ H3 Hedef hücresi: ${endCell}`);

        // H3 grid üzerinde A* algoritması
        const h3Path = this.aStarOnH3Grid(startCell, endCell);

        if (h3Path.length === 0) {
            throw new Error('Rota bulunamadı!');
        }

        // H3 path'i polyline'a çevir
        const polyline = this.h3PathToPolyline(h3Path);

        // Waypoint'leri hesapla
        const waypoints = this.calculateWaypoints(polyline);

        // Mesafe ve süre hesapla
        const distance = this.calculateTotalDistance(polyline);
        const estimatedTime = this.estimateTravelTime(distance);

        const route: Route = {
            driverId,
            startLocation: start,
            endLocation: end,
            h3Path,
            polyline,
            distance,
            estimatedTime,
            waypoints,
            createdAt: new Date()
        };

        console.log(`✅ H3 rota hesaplandı: ${h3Path.length} hücre, ${distance.toFixed(2)} km`);

        return route;
    }

    /**
     * H3 grid üzerinde A* algoritması
     */
    private aStarOnH3Grid(start: string, goal: string): string[] {
        const openSet = new Set([start]);
        const cameFrom = new Map<string, string>();
        const gScore = new Map<string, number>([[start, 0]]);
        const fScore = new Map<string, number>([[start, this.h3Heuristic(start, goal)]]);

        while (openSet.size > 0) {
            // En düşük fScore'lu hücreyi seç
            const current = this.getLowestFScore(openSet, fScore);

            if (current === goal) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.delete(current);

            // Komşu hücreleri kontrol et
            const neighbors = gridDisk(current, 1);
            for (const neighbor of neighbors) {
                const tentativeGScore = gScore.get(current)! + this.h3Distance(current, neighbor);

                if (tentativeGScore < (gScore.get(neighbor) || Infinity)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);
                    fScore.set(neighbor, tentativeGScore + this.h3Heuristic(neighbor, goal));
                    openSet.add(neighbor);
                }
            }
        }

        return []; // Yol bulunamadı
    }

    /**
     * H3 hücreleri arası heuristic mesafe
     */
    private h3Heuristic(cellA: string, cellB: string): number {
        const [latA, lngA] = cellToLatLng(cellA);
        const [latB, lngB] = cellToLatLng(cellB);

        return this.haversineDistance(latA, lngA, latB, lngB);
    }

    /**
     * H3 hücreleri arası mesafe
     */
    private h3Distance(cellA: string, cellB: string): number {
        const [latA, lngA] = cellToLatLng(cellA);
        const [latB, lngB] = cellToLatLng(cellB);

        return this.haversineDistance(latA, lngA, latB, lngB);
    }

    /**
     * Haversine mesafe hesaplama
     */
    private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Dünya yarıçapı (km)
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * En düşük fScore'lu hücreyi bul
     */
    private getLowestFScore(openSet: Set<string>, fScore: Map<string, number>): string {
        let lowest = null;
        let lowestScore = Infinity;

        for (const cell of openSet) {
            const score = fScore.get(cell) || Infinity;
            if (score < lowestScore) {
                lowest = cell;
                lowestScore = score;
            }
        }

        return lowest!;
    }

    /**
     * Yolu geri oluştur
     */
    private reconstructPath(cameFrom: Map<string, string>, current: string): string[] {
        const path = [current];

        while (cameFrom.has(current)) {
            current = cameFrom.get(current)!;
            path.unshift(current);
        }

        return path;
    }

    /**
     * H3 path'i polyline'a çevir
     */
    private h3PathToPolyline(h3Path: string[]): Location[] {
        return h3Path.map(cell => {
            const [lat, lng] = cellToLatLng(cell);
            return { lat, lng };
        });
    }

    /**
     * Waypoint'leri hesapla (her 50km'de bir)
     */
    private calculateWaypoints(polyline: Location[]): Location[] {
        const waypoints: Location[] = [];
        let accumulatedDistance = 0;

        for (let i = 1; i < polyline.length; i++) {
            const distance = this.haversineDistance(
                polyline[i - 1].lat, polyline[i - 1].lng,
                polyline[i].lat, polyline[i].lng
            );

            accumulatedDistance += distance;

            if (accumulatedDistance >= 50) { // Her 50km'de bir waypoint
                waypoints.push(polyline[i]);
                accumulatedDistance = 0;
            }
        }

        return waypoints;
    }

    /**
     * Toplam mesafe hesapla
     */
    calculateTotalDistance(polyline: Location[]): number {
        let totalDistance = 0;

        for (let i = 1; i < polyline.length; i++) {
            totalDistance += this.haversineDistance(
                polyline[i - 1].lat, polyline[i - 1].lng,
                polyline[i].lat, polyline[i].lng
            );
        }

        return totalDistance;
    }

    /**
     * Seyahat süresini tahmin et (ortalama 80 km/h)
     */
    private estimateTravelTime(distance: number): number {
        const averageSpeed = 80; // km/h
        return Math.round((distance / averageSpeed) * 60); // dakika
    }

    /**
     * Çoklu sürücü rota optimizasyonu
     */
    async optimizeMultipleRoutes(drivers: Array<{ id: string, start: Location, end: Location }>): Promise<Route[]> {
        console.log(`🚀 ${drivers.length} sürücü için rota optimizasyonu başlatılıyor`);

        const routes: Route[] = [];

        for (const driver of drivers) {
            try {
                const route = await this.calculateRoute(driver.id, driver.start, driver.end);
                routes.push(route);
            } catch (error) {
                console.error(`❌ Sürücü ${driver.id} için rota hesaplanamadı:`, error.message);
            }
        }

        console.log(`✅ ${routes.length} rota başarıyla hesaplandı`);
        return routes;
    }
} 