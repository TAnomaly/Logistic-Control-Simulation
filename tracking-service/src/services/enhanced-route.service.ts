import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { latLngToCell, cellToLatLng } from 'h3-js';
import * as polyline from '@mapbox/polyline';

// Database entities
export interface DriverLocation {
    driverId: string;
    latitude: number;
    longitude: number;
    recordedAt: Date;
    speed?: number;
    heading?: number;
}

export interface OptimizedRouteData {
    id: string;
    driverId: string;
    geometryId: string;
    startLatitude: number;
    startLongitude: number;
    startLocationTimestamp: Date;
    waypoints: RouteWaypoint[];
    optimizedOrder: string[];
    totalDistance: number;
    totalTime: number;
    status: string;
    createdAt: Date;
}

export interface RouteWaypoint {
    id: string;
    routeId: string;
    shipmentId?: string;
    latitude: number;
    longitude: number;
    address?: string;
    h3Index: string;
    waypointType: 'pickup' | 'delivery' | 'waypoint';
    sequenceOrder: number;
    status: 'pending' | 'approaching' | 'arrived' | 'completed' | 'skipped';
    estimatedArrival?: Date;
    actualArrival?: Date;
}

export interface RouteGeometry {
    id: string;
    routeId: string;
    encodedPolyline: string;
    coordinates: number[][];
    totalDistance: number;
    totalDuration: number;
    compressionLevel: number;
}

@Injectable()
export class EnhancedRouteService {
    private readonly logger = new Logger(EnhancedRouteService.name);

    constructor() { }

    /**
     * Get driver's current location from driver_locations table
     */
    async getDriverCurrentLocation(driverId: string): Promise<DriverLocation | null> {
        try {
            // This would be a real database query
            // For now, simulate with a mock query
            const mockLocation: DriverLocation = {
                driverId: driverId,
                latitude: 41.0082,
                longitude: 28.9784,
                recordedAt: new Date(),
                speed: 0,
                heading: 0
            };

            this.logger.log(`Retrieved current location for driver ${driverId}: ${mockLocation.latitude}, ${mockLocation.longitude}`);
            return mockLocation;
        } catch (error) {
            this.logger.error(`Failed to get current location for driver ${driverId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Create optimized route starting from driver's current location
     */
    async optimizeRouteFromCurrentLocation(
        driverId: string,
        shipmentIds: string[]
    ): Promise<OptimizedRouteData> {
        try {
            this.logger.log(`Starting route optimization for driver ${driverId} with shipments: ${shipmentIds.join(', ')}`);

            // 1. Get driver's current location
            const currentLocation = await this.getDriverCurrentLocation(driverId);
            if (!currentLocation) {
                throw new HttpException('Driver current location not found', HttpStatus.NOT_FOUND);
            }

            // 2. Get shipment locations (mock data for now)
            const shipmentLocations = await this.getShipmentLocations(shipmentIds);

            // 3. Create waypoints starting from current location
            const waypoints = await this.createOptimizedWaypoints(currentLocation, shipmentLocations);

            // 4. Calculate optimized route using H3
            const optimizedOrder = await this.calculateOptimizedOrder(currentLocation, waypoints);

            // 5. Generate polyline from current location
            const routeGeometry = await this.generateRoutePolyline(currentLocation, waypoints, optimizedOrder);

            // 6. Create optimized route record
            const optimizedRoute: OptimizedRouteData = {
                id: `route-${driverId}-${Date.now()}`,
                driverId: driverId,
                geometryId: routeGeometry.id,
                startLatitude: currentLocation.latitude,
                startLongitude: currentLocation.longitude,
                startLocationTimestamp: currentLocation.recordedAt,
                waypoints: waypoints,
                optimizedOrder: optimizedOrder,
                totalDistance: routeGeometry.totalDistance,
                totalTime: routeGeometry.totalDuration,
                status: 'planned',
                createdAt: new Date()
            };

            this.logger.log(`Route optimization completed for driver ${driverId}. Total distance: ${routeGeometry.totalDistance}m, Total time: ${routeGeometry.totalDuration}s`);
            return optimizedRoute;

        } catch (error) {
            this.logger.error(`Route optimization failed for driver ${driverId}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get shipment locations for route planning
     */
    private async getShipmentLocations(shipmentIds: string[]): Promise<any[]> {
        // Mock shipment locations - in real implementation, query from database
        const mockShipments = shipmentIds.map((id, index) => ({
            id: id,
            pickupLatitude: 41.0082 + (index * 0.01),
            pickupLongitude: 28.9784 + (index * 0.01),
            deliveryLatitude: 41.0082 + (index * 0.02),
            deliveryLongitude: 28.9784 + (index * 0.02),
            address: `Shipment ${id} Location`,
            priority: 5
        }));

        return mockShipments;
    }

    /**
     * Create waypoints with H3 indexing
     */
    private async createOptimizedWaypoints(
        startLocation: DriverLocation,
        shipments: any[]
    ): Promise<RouteWaypoint[]> {
        const waypoints: RouteWaypoint[] = [];
        let sequenceOrder = 1;

        for (const shipment of shipments) {
            // Pickup waypoint
            const pickupH3 = latLngToCell(shipment.pickupLatitude, shipment.pickupLongitude, 9);
            waypoints.push({
                id: `${shipment.id}-pickup`,
                routeId: '', // Will be set later
                shipmentId: shipment.id,
                latitude: shipment.pickupLatitude,
                longitude: shipment.pickupLongitude,
                address: `${shipment.address} - Pickup`,
                h3Index: pickupH3,
                waypointType: 'pickup',
                sequenceOrder: sequenceOrder++,
                status: 'pending'
            });

            // Delivery waypoint
            const deliveryH3 = latLngToCell(shipment.deliveryLatitude, shipment.deliveryLongitude, 9);
            waypoints.push({
                id: `${shipment.id}-delivery`,
                routeId: '', // Will be set later
                shipmentId: shipment.id,
                latitude: shipment.deliveryLatitude,
                longitude: shipment.deliveryLongitude,
                address: `${shipment.address} - Delivery`,
                h3Index: deliveryH3,
                waypointType: 'delivery',
                sequenceOrder: sequenceOrder++,
                status: 'pending'
            });
        }

        this.logger.log(`Created ${waypoints.length} waypoints with H3 indexing`);
        return waypoints;
    }

    /**
     * Calculate optimized order using H3 and TSP algorithm
     */
    private async calculateOptimizedOrder(
        startLocation: DriverLocation,
        waypoints: RouteWaypoint[]
    ): Promise<string[]> {
        // Simple nearest neighbor algorithm for now
        // In production, use proper TSP solver with H3 distance calculations

        const startH3 = latLngToCell(startLocation.latitude, startLocation.longitude, 9);
        this.logger.log(`Starting optimization from H3 cell: ${startH3}`);

        // For now, return waypoints in creation order
        // TODO: Implement proper H3-based TSP optimization
        const optimizedOrder = waypoints.map(wp => wp.id);

        this.logger.log(`Calculated optimized order: ${optimizedOrder.join(' -> ')}`);
        return optimizedOrder;
    }

    /**
     * Generate professional polyline from current location
     */
    private async generateRoutePolyline(
        startLocation: DriverLocation,
        waypoints: RouteWaypoint[],
        optimizedOrder: string[]
    ): Promise<RouteGeometry> {
        const coordinates: number[][] = [];

        // Start from driver's current location
        coordinates.push([startLocation.longitude, startLocation.latitude]);

        // Add waypoints in optimized order
        for (const waypointId of optimizedOrder) {
            const waypoint = waypoints.find(wp => wp.id === waypointId);
            if (waypoint) {
                coordinates.push([waypoint.longitude, waypoint.latitude]);
            }
        }

        // Encode polyline with precision 5 (professional standard)
        const encodedPolyline = polyline.encode(
            coordinates.map(coord => [coord[1], coord[0]]), // polyline expects [lat, lng]
            5
        );

        // Calculate total distance and duration (mock calculation)
        const totalDistance = this.calculateTotalDistance(coordinates);
        const totalDuration = this.estimateTotalDuration(totalDistance);

        const routeGeometry: RouteGeometry = {
            id: `geom-${Date.now()}`,
            routeId: '', // Will be set by caller
            encodedPolyline: encodedPolyline,
            coordinates: coordinates,
            totalDistance: totalDistance,
            totalDuration: totalDuration,
            compressionLevel: 5
        };

        this.logger.log(`Generated polyline with ${coordinates.length} points, encoded length: ${encodedPolyline.length} chars`);
        return routeGeometry;
    }

    /**
     * Calculate total distance using Haversine formula
     */
    private calculateTotalDistance(coordinates: number[][]): number {
        let totalDistance = 0;

        for (let i = 1; i < coordinates.length; i++) {
            const [lng1, lat1] = coordinates[i - 1];
            const [lng2, lat2] = coordinates[i];

            const distance = this.haversineDistance(lat1, lng1, lat2, lng2);
            totalDistance += distance;
        }

        return Math.round(totalDistance);
    }

    /**
     * Haversine distance calculation
     */
    private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000; // Earth's radius in meters
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
     * Estimate total duration based on distance
     */
    private estimateTotalDuration(distanceMeters: number): number {
        const averageSpeedKmh = 50; // Average city driving speed
        const averageSpeedMs = (averageSpeedKmh * 1000) / 3600;
        return Math.round(distanceMeters / averageSpeedMs);
    }

    /**
     * Update driver location and check for route re-optimization
     */
    async updateDriverLocationAndOptimizeIfNeeded(
        driverId: string,
        newLatitude: number,
        newLongitude: number
    ): Promise<{ locationUpdated: boolean; routeReoptimized: boolean; newRoute?: OptimizedRouteData }> {
        try {
            this.logger.log(`Updating location for driver ${driverId}: ${newLatitude}, ${newLongitude}`);

            // In real implementation, update driver_locations table
            // For now, just log the update

            // Check if re-optimization is needed based on distance moved
            const currentLocation = await this.getDriverCurrentLocation(driverId);
            if (currentLocation) {
                const distanceMoved = this.haversineDistance(
                    currentLocation.latitude, currentLocation.longitude,
                    newLatitude, newLongitude
                );

                const REOPTIMIZATION_THRESHOLD = 1000; // 1km
                if (distanceMoved > REOPTIMIZATION_THRESHOLD) {
                    this.logger.log(`Driver moved ${distanceMoved}m, triggering route re-optimization`);

                    // Get current route shipments and re-optimize
                    const activeShipments = ['shipment-1', 'shipment-2']; // Mock data
                    const newRoute = await this.optimizeRouteFromCurrentLocation(driverId, activeShipments);

                    return {
                        locationUpdated: true,
                        routeReoptimized: true,
                        newRoute: newRoute
                    };
                }
            }

            return {
                locationUpdated: true,
                routeReoptimized: false
            };

        } catch (error) {
            this.logger.error(`Failed to update location for driver ${driverId}: ${error.message}`);
            throw error;
        }
    }
}
