import { Controller, Post, Get, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { H3RouteService, Location, Route } from '../services/h3-route.service';

interface CalculateRouteRequest {
    driverId: string;
    startLocation: Location;
    endLocation: Location;
}

interface OptimizeRoutesRequest {
    drivers: Array<{
        id: string;
        startLocation: Location;
        endLocation: Location;
    }>;
}

@Controller('api/routes')
export class RouteController {
    constructor(private readonly h3RouteService: H3RouteService) { }

    /**
     * Tek sürücü için rota hesapla ve Driver DB'ye kaydet
     */
    @Post('calculate')
    async calculateRoute(@Body() request: CalculateRouteRequest) {
        try {
            console.log(`🚀 Rota hesaplama isteği: ${request.driverId}`);

            // H3 ile rota hesapla
            const route = await this.h3RouteService.calculateRoute(
                request.driverId,
                request.startLocation,
                request.endLocation
            );

            // Driver DB'ye kaydet
            await this.saveRouteToDriverDB(route);

            console.log(`✅ Rota başarıyla hesaplandı ve kaydedildi: ${request.driverId}`);

            return {
                success: true,
                message: 'Rota başarıyla hesaplandı ve kaydedildi',
                data: {
                    driverId: route.driverId,
                    distance: route.distance,
                    estimatedTime: route.estimatedTime,
                    waypointsCount: route.waypoints.length,
                    polylinePoints: route.polyline.length
                }
            };
        } catch (error) {
            console.error(`❌ Rota hesaplama hatası:`, error.message);
            throw new HttpException(
                `Rota hesaplanamadı: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Çoklu sürücü rota optimizasyonu
     */
    @Post('optimize')
    async optimizeRoutes(@Body() request: OptimizeRoutesRequest) {
        try {
            console.log(`🚀 ${request.drivers.length} sürücü için rota optimizasyonu`);

            // H3 ile rotaları hesapla
            const routes = await this.h3RouteService.optimizeMultipleRoutes(
                request.drivers.map(driver => ({
                    id: driver.id,
                    start: driver.startLocation,
                    end: driver.endLocation
                }))
            );

            // Tüm rotaları Driver DB'ye kaydet
            for (const route of routes) {
                await this.saveRouteToDriverDB(route);
            }

            console.log(`✅ ${routes.length} rota başarıyla optimize edildi ve kaydedildi`);

            return {
                success: true,
                message: `${routes.length} rota başarıyla optimize edildi`,
                data: {
                    totalRoutes: routes.length,
                    totalDistance: routes.reduce((sum, route) => sum + route.distance, 0),
                    averageTime: Math.round(
                        routes.reduce((sum, route) => sum + route.estimatedTime, 0) / routes.length
                    )
                }
            };
        } catch (error) {
            console.error(`❌ Rota optimizasyonu hatası:`, error.message);
            throw new HttpException(
                `Rota optimizasyonu başarısız: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Sürücü rotasını getir (Driver DB'den)
     */
    @Get(':driverId')
    async getDriverRoute(@Param('driverId') driverId: string) {
        try {
            console.log(`📋 Sürücü rotası getiriliyor: ${driverId}`);

            // Driver DB'den rota bilgilerini getir
            const route = await this.getRouteFromDriverDB(driverId);

            if (!route) {
                throw new HttpException(
                    `Sürücü ${driverId} için rota bulunamadı`,
                    HttpStatus.NOT_FOUND
                );
            }

            return {
                success: true,
                data: route
            };
        } catch (error) {
            console.error(`❌ Rota getirme hatası:`, error.message);
            throw new HttpException(
                `Rota getirilemedi: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Tüm sürücü rotalarını getir
     */
    @Get()
    async getAllRoutes() {
        try {
            console.log(`📋 Tüm sürücü rotaları getiriliyor`);

            // Driver DB'den tüm rotaları getir
            const routes = await this.getAllRoutesFromDriverDB();

            return {
                success: true,
                data: {
                    totalRoutes: routes.length,
                    routes: routes
                }
            };
        } catch (error) {
            console.error(`❌ Rotalar getirme hatası:`, error.message);
            throw new HttpException(
                `Rotalar getirilemedi: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Rota bilgilerini Driver DB'ye kaydet
     */
    private async saveRouteToDriverDB(route: Route): Promise<void> {
        try {
            // PostgreSQL bağlantısı (Driver DB)
            const { Client } = require('pg');
            const client = new Client({
                host: process.env.DB_HOST || 'postgres',
                port: parseInt(process.env.DB_PORT || '5432'),
                user: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: 'driver_db'
            });

            await client.connect();

            // Önce mevcut rotayı sil
            await client.query(
                'DELETE FROM driver_routes WHERE driver_id = $1',
                [route.driverId]
            );

            // Yeni rotayı ekle
            await client.query(`
        INSERT INTO driver_routes (
          driver_id, 
          start_latitude, 
          start_longitude, 
          end_latitude, 
          end_longitude,
          h3_path,
          polyline_coordinates,
          waypoints,
          distance,
          estimated_time,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
                route.driverId,
                route.startLocation.lat,
                route.startLocation.lng,
                route.endLocation.lat,
                route.endLocation.lng,
                JSON.stringify(route.h3Path),
                JSON.stringify(route.polyline),
                JSON.stringify(route.waypoints),
                route.distance,
                route.estimatedTime,
                route.createdAt
            ]);

            await client.end();

            console.log(`💾 Rota Driver DB'ye kaydedildi: ${route.driverId}`);
        } catch (error) {
            console.error(`❌ Driver DB kaydetme hatası:`, error.message);
            throw error;
        }
    }

    /**
     * Driver DB'den rota bilgilerini getir
     */
    private async getRouteFromDriverDB(driverId: string): Promise<any> {
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: process.env.DB_HOST || 'postgres',
                port: parseInt(process.env.DB_PORT || '5432'),
                user: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: 'driver_db'
            });

            await client.connect();

            const result = await client.query(`
        SELECT * FROM driver_routes 
        WHERE driver_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [driverId]);

            await client.end();

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                driverId: row.driver_id,
                startLocation: {
                    lat: parseFloat(row.start_latitude),
                    lng: parseFloat(row.start_longitude)
                },
                endLocation: {
                    lat: parseFloat(row.end_latitude),
                    lng: parseFloat(row.end_longitude)
                },
                h3Path: JSON.parse(row.h3_path),
                polyline: JSON.parse(row.polyline_coordinates),
                waypoints: JSON.parse(row.waypoints),
                distance: parseFloat(row.distance),
                estimatedTime: parseInt(row.estimated_time),
                createdAt: row.created_at
            };
        } catch (error) {
            console.error(`❌ Driver DB'den rota getirme hatası:`, error.message);
            throw error;
        }
    }

    /**
     * Driver DB'den tüm rotaları getir
     */
    private async getAllRoutesFromDriverDB(): Promise<any[]> {
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: process.env.DB_HOST || 'postgres',
                port: parseInt(process.env.DB_PORT || '5432'),
                user: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: 'driver_db'
            });

            await client.connect();

            const result = await client.query(`
        SELECT * FROM driver_routes 
        ORDER BY created_at DESC
      `);

            await client.end();

            return result.rows.map(row => ({
                driverId: row.driver_id,
                startLocation: {
                    lat: parseFloat(row.start_latitude),
                    lng: parseFloat(row.start_longitude)
                },
                endLocation: {
                    lat: parseFloat(row.end_latitude),
                    lng: parseFloat(row.end_longitude)
                },
                distance: parseFloat(row.distance),
                estimatedTime: parseInt(row.estimated_time),
                createdAt: row.created_at
            }));
        } catch (error) {
            console.error(`❌ Driver DB'den rotalar getirme hatası:`, error.message);
            throw error;
        }
    }
} 