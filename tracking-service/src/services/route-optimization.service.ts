import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { H3RouteService, ShipmentLocation, Location } from './h3-route.service';
import { TypeOrmDriverRouteRepository } from '../infrastructure/repositories/typeorm-driver-route.repository';
import { DriverRoute } from '../domain/entities/driver-route.entity';
import { Repository } from 'typeorm';
import { DriverAssignment, AssignmentStatus } from '../domain/entities/driver-assignment.entity';
import { Shipment } from '../domain/entities/shipment.entity';
import axios from 'axios';

@Injectable()
export class RouteOptimizationService {
    constructor(
        private readonly h3RouteService: H3RouteService,
        private readonly driverRouteRepository: TypeOrmDriverRouteRepository,
        @InjectRepository(DriverAssignment)
        private readonly assignmentRepo: Repository<DriverAssignment>,
        @InjectRepository(Shipment)
        private readonly shipmentRepo: Repository<Shipment>
    ) { }

    /**
     * Belirli bir driver için optimize route hesapla ve kaydet
     */
    async optimizeAndSaveRoute(driverId: string): Promise<DriverRoute> {
        console.log(`🚀 Driver ${driverId} için route optimizasyonu başlatılıyor`);

        try {
            // Driver'ın aktif shipment'larını al
            const shipments = await this.getDriverActiveShipments(driverId);

            if (shipments.length === 0) {
                throw new Error(`Driver ${driverId} için aktif shipment bulunamadı!`);
            }

            console.log(`📦 ${shipments.length} aktif shipment bulundu`);

            // Driver'ın mevcut konumunu al
            const driverLocation = await this.getDriverCurrentLocation(driverId);
            console.log(`📍 Driver ${driverId} mevcut konumu:`, driverLocation);

            // H3 ile optimize route hesapla (driver konumu ile)
            const optimizedRoute = await this.h3RouteService.calculateOptimizedRoute(
                driverId,
                shipments,
                driverLocation
            );

            // Mevcut aktif route'ları deaktif et
            const existingActiveRoutes = await this.driverRouteRepository.findActiveByDriverId(driverId);
            for (const existingRoute of existingActiveRoutes) {
                existingRoute.status = 'completed';
                await this.driverRouteRepository.save(existingRoute);
            }

            // Yeni route'u kaydet
            const driverRoute = new DriverRoute();
            driverRoute.driverId = driverId;
            driverRoute.optimizedRoute = optimizedRoute.route;
            driverRoute.totalDistance = optimizedRoute.route.totalDistance;
            driverRoute.totalTime = optimizedRoute.route.totalDuration;
            driverRoute.fuelEstimate = optimizedRoute.route.totalDistance * 0.1; // 0.1 L/km
            driverRoute.efficiency = 85.5; // %85.5 verimlilik
            driverRoute.status = 'planned';
            driverRoute.startedAt = new Date();
            driverRoute.completedAt = new Date(Date.now() + optimizedRoute.route.totalDuration * 1000);

            const savedRoute = await this.driverRouteRepository.save(driverRoute);

            console.log(`✅ Driver ${driverId} için optimize route kaydedildi: ${savedRoute.id}`);
            console.log(`📊 Toplam mesafe: ${optimizedRoute.route.totalDistance.toFixed(2)} km`);
            console.log(`⏱️ Tahmini süre: ${optimizedRoute.route.totalDuration} dakika`);

            return savedRoute;

        } catch (error) {
            console.error(`❌ Driver ${driverId} için route optimizasyonu başarısız:`, error.message);
            throw error;
        }
    }

    /**
     * Tüm driver'lar için optimize route hesapla
     */
    async optimizeAllDriverRoutes(): Promise<DriverRoute[]> {
        console.log(`🚀 Tüm driver'lar için route optimizasyonu başlatılıyor`);

        try {
            // Aktif shipment'ı olan tüm driver'ları al
            const driversWithShipments = await this.getDriversWithActiveShipments();

            if (driversWithShipments.length === 0) {
                console.log(`ℹ️ Aktif shipment'ı olan driver bulunamadı`);
                return [];
            }

            console.log(`👥 ${driversWithShipments.length} driver için optimizasyon yapılacak`);

            const optimizedRoutes: DriverRoute[] = [];

            for (const driverId of driversWithShipments) {
                try {
                    const route = await this.optimizeAndSaveRoute(driverId);
                    optimizedRoutes.push(route);
                } catch (error) {
                    console.error(`❌ Driver ${driverId} için optimizasyon başarısız:`, error.message);
                }
            }

            console.log(`✅ ${optimizedRoutes.length} driver için route optimizasyonu tamamlandı`);
            return optimizedRoutes;

        } catch (error) {
            console.error(`❌ Toplu route optimizasyonu başarısız:`, error.message);
            throw error;
        }
    }

    /**
 * Driver'ın aktif shipment'larını al (production-ready, DB'den)
 */
    private async getDriverActiveShipments(driverId: string): Promise<ShipmentLocation[]> {
        // Aktif assignment'ları çek
        const assignments = await this.assignmentRepo.find({
            where: {
                driverId,
                status: AssignmentStatus.ASSIGNED
            }
        });
        if (assignments.length === 0) return [];

        // Shipment ID'lerini topla
        const shipmentIds = assignments.map(a => a.shipmentId);

        // TypeORM'in yeni syntax'ını kullan
        const shipments = await this.shipmentRepo.find({
            where: shipmentIds.map(id => ({ id }))
        });

        // ShipmentLocation array'ine dönüştür
        return shipments.map(shipment => ({
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            pickup: {
                lat: Number(shipment.pickupLatitude) || 0,
                lng: Number(shipment.pickupLongitude) || 0
            },
            delivery: {
                lat: Number(shipment.deliveryLatitude) || 0,
                lng: Number(shipment.deliveryLongitude) || 0
            }
        })).filter(shipment =>
            shipment.pickup.lat !== 0 && shipment.pickup.lng !== 0 &&
            shipment.delivery.lat !== 0 && shipment.delivery.lng !== 0
        );
    }

    /**
 * Driver'ın mevcut konumunu al (Driver API'den)
 */
    private async getDriverCurrentLocation(driverId: string): Promise<Location | null> {
        try {
            // Driver API'den driver bilgilerini al
            const response = await axios.get(`http://localhost:80/api/driver/api/drivers/${driverId}`);

            if (response.data && response.data.currentLocation) {
                console.log(`📍 Driver ${driverId} konumu alındı:`, response.data.currentLocation);
                return {
                    lat: response.data.currentLocation.latitude,
                    lng: response.data.currentLocation.longitude
                };
            }

            console.log(`⚠️ Driver ${driverId} için currentLocation bulunamadı`);
            return null;

        } catch (error) {
            console.error(`❌ Driver ${driverId} konumu alınamadı:`, error.message);
            return null;
        }
    }

    /**
     * Aktif shipment'ı olan driver'ları al (production-ready, DB'den)
     */
    private async getDriversWithActiveShipments(): Promise<string[]> {
        // Aktif assignment'ları çek
        const assignments = await this.assignmentRepo.find({
            where: {
                status: AssignmentStatus.ASSIGNED
            }
        });
        // Benzersiz driverId'leri döndür
        return Array.from(new Set(assignments.map(a => a.driverId)));
    }

    /**
     * Driver'ın mevcut aktif route'unu deaktive et
     */
    private async deactivateExistingRoute(driverId: string): Promise<void> {
        try {
            const existingRoutes = await this.driverRouteRepository.findActiveByDriverId(driverId);
            for (const existingRoute of existingRoutes) {
                await this.driverRouteRepository.updateStatus(existingRoute.id, 'completed');
            }
        } catch (error) {
            console.error(`❌ Mevcut route deaktif etme hatası: ${error.message}`);
        }
    }

    /**
     * Tahmini bitiş zamanını hesapla
     */
    private calculateEstimatedEndTime(durationMinutes: number): Date {
        const endTime = new Date();
        endTime.setMinutes(endTime.getMinutes() + durationMinutes);
        return endTime;
    }

    /**
     * Driver'ın aktif route'unu getir
     */
    async getDriverActiveRoute(driverId: string): Promise<DriverRoute | null> {
        const activeRoutes = await this.driverRouteRepository.findActiveByDriverId(driverId);
        return activeRoutes.length > 0 ? activeRoutes[0] : null;
    }

    /**
     * Driver'ın tüm route'larını getir
     */
    async getDriverRoutes(driverId: string): Promise<DriverRoute[]> {
        return await this.driverRouteRepository.findByDriverId(driverId);
    }

    /**
     * Tüm route'ları getir
     */
    async getAllRoutes(): Promise<DriverRoute[]> {
        return await this.driverRouteRepository.findAll();
    }

    /**
     * Driver'ın polyline'ına yeni konum ekle
     */
    async updateDriverPolyline(driverId: string, newLocation: Location): Promise<DriverRoute | null> {
        try {
            console.log(`🔄 Driver ${driverId} polyline güncelleniyor...`);

            // Driver'ın aktif rotasını al
            const activeRoute = await this.getDriverActiveRoute(driverId);

            if (!activeRoute || !activeRoute.optimizedRoute) {
                console.log(`⚠️ Driver ${driverId} için aktif rota bulunamadı`);
                return null;
            }

            // Mevcut polyline'ı decode et
            const currentPolyline = this.h3RouteService.decodePolyline(activeRoute.optimizedRoute.polyline);

            // Yeni konumu polyline'a ekle
            const updatedPolyline = [...currentPolyline, newLocation];

            // Güncellenmiş polyline'ı encode et
            const encodedPolyline = this.h3RouteService.encodePolyline(updatedPolyline);

            // Toplam mesafeyi hesapla
            const totalDistance = this.h3RouteService.calculateTotalDistance(updatedPolyline);

            // Rota bilgilerini güncelle
            activeRoute.optimizedRoute.polyline = encodedPolyline;
            activeRoute.totalDistance = totalDistance;
            activeRoute.fuelEstimate = totalDistance * 0.1; // 0.1 L/km
            activeRoute.updatedAt = new Date();

            // Güncellenmiş rotayı kaydet
            const updatedRoute = await this.driverRouteRepository.save(activeRoute);

            console.log(`✅ Driver ${driverId} polyline güncellendi. Yeni mesafe: ${totalDistance.toFixed(2)} km`);

            return updatedRoute;

        } catch (error) {
            console.error(`❌ Driver ${driverId} polyline güncelleme hatası:`, error.message);
            return null;
        }
    }
} 