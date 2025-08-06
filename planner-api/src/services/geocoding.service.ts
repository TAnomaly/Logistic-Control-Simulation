import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GeocodingResult {
    latitude: number;
    longitude: number;
    displayName: string;
    confidence: number;
}

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);
    private readonly baseUrl = 'https://nominatim.openstreetmap.org';

    /**
     * Şehir ismini koordinatlara çevir
     */
    async geocodeCity(cityName: string, countryCode: string = 'TR'): Promise<GeocodingResult | null> {
        try {
            this.logger.log(`🔍 Geocoding: ${cityName}, ${countryCode}`);

            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    q: `${cityName}, ${countryCode}`,
                    format: 'json',
                    limit: 1,
                    addressdetails: 1,
                    countrycodes: countryCode.toLowerCase()
                },
                headers: {
                    'User-Agent': 'LogisticControlSystem/1.0'
                }
            });

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                return {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon),
                    displayName: result.display_name,
                    confidence: this.calculateConfidence(result)
                };
            }

            this.logger.warn(`❌ No geocoding result found for: ${cityName}`);
            return null;

        } catch (error) {
            this.logger.error(`❌ Geocoding error for ${cityName}:`, error.message);
            return null;
        }
    }

    /**
     * Koordinatları şehir ismine çevir (reverse geocoding)
     */
    async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
        try {
            this.logger.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);

            const response = await axios.get(`${this.baseUrl}/reverse`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'LogisticControlSystem/1.0'
                }
            });

            if (response.data && response.data.address) {
                const address = response.data.address;
                return address.city || address.town || address.village || address.county || 'Unknown Location';
            }

            return null;

        } catch (error) {
            this.logger.error(`❌ Reverse geocoding error:`, error.message);
            return null;
        }
    }

    /**
     * İki nokta arasındaki mesafeyi hesapla (Haversine formula)
     */
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Dünya'nın yarıçapı (km)
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Türkiye'deki popüler şehirler için cache
     */
    private readonly turkishCitiesCache = new Map<string, GeocodingResult>();

    /**
     * Cache'li geocoding (performans için)
     */
    async geocodeTurkishCity(cityName: string): Promise<GeocodingResult | null> {
        const normalizedCity = cityName.toLowerCase().trim();

        // Cache'den kontrol et
        if (this.turkishCitiesCache.has(normalizedCity)) {
            this.logger.log(`📦 Cache hit for: ${cityName}`);
            return this.turkishCitiesCache.get(normalizedCity)!;
        }

        // API'den al
        const result = await this.geocodeCity(cityName, 'TR');

        if (result) {
            // Cache'e ekle
            this.turkishCitiesCache.set(normalizedCity, result);
            this.logger.log(`💾 Cached result for: ${cityName}`);
        }

        return result;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private calculateConfidence(result: any): number {
        // Nominatim sonucunun güvenilirliğini hesapla
        let confidence = 0.5; // Base confidence

        if (result.importance) {
            confidence += Math.min(result.importance / 0.5, 0.3);
        }

        if (result.address && result.address.country === 'Türkiye') {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }
} 