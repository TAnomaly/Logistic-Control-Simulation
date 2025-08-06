import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { H3RouteService, ShipmentLocation } from './h3-route.service';
import { TypeOrmDriverRouteRepository } from '../infrastructure/repositories/typeorm-driver-route.repository';
import { DriverRoute } from '../domain/entities/driver-route.entity';
import { Repository } from 'typeorm';
import { DriverAssignment, AssignmentStatus } from '../domain/entities/driver-assignment.entity';
import { Shipment } from '../domain/entities/shipment.entity';

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

            // H3 ile optimize route hesapla
            const optimizedRoute = await this.h3RouteService.calculateOptimizedRoute(
                driverId,
                shipments
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
        const shipments = await this.shipmentRepo.findByIds(shipmentIds);

        // ShipmentLocation array'ine dönüştür
        return shipments.map(shipment => ({
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            pickup: {
                lat: Number(shipment.pickupLatitude),
                lng: Number(shipment.pickupLongitude)
            },
            delivery: {
                lat: Number(shipment.deliveryLatitude),
                lng: Number(shipment.deliveryLongitude)
            }
        }));
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
} 