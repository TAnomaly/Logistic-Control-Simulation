// Route Helper Functions
// Bu dosya route bilgilerini anlaşılır hale getirmek için kullanılır

/**
 * Türkiye şehir koordinatları
 */
const TURKEY_CITIES = {
    'Istanbul': { lat: 41.0082, lng: 28.9784, name: 'İstanbul' },
    'Ankara': { lat: 39.9334, lng: 32.8597, name: 'Ankara' },
    'Izmir': { lat: 38.4192, lng: 27.1287, name: 'İzmir' },
    'Antalya': { lat: 36.8969, lng: 30.7133, name: 'Antalya' },
    'Bursa': { lat: 40.1885, lng: 29.0610, name: 'Bursa' },
    'Adana': { lat: 37.0000, lng: 35.3213, name: 'Adana' },
    'Konya': { lat: 37.8667, lng: 32.4833, name: 'Konya' },
    'Gaziantep': { lat: 37.0662, lng: 37.3833, name: 'Gaziantep' },
    'Mersin': { lat: 36.8000, lng: 34.6333, name: 'Mersin' },
    'Diyarbakir': { lat: 37.9144, lng: 40.2306, name: 'Diyarbakır' },
    'Mardin': { lat: 37.3212, lng: 40.7245, name: 'Mardin' },
    'Tekirdag': { lat: 40.9781, lng: 27.5117, name: 'Tekirdağ' }
};

/**
 * Koordinatlardan şehir adını bul
 */
function findCityByCoordinates(lat, lng) {
    const tolerance = 0.5; // 0.5 derece tolerans
    
    for (const [cityKey, cityData] of Object.entries(TURKEY_CITIES)) {
        const latDiff = Math.abs(lat - cityData.lat);
        const lngDiff = Math.abs(lng - cityData.lng);
        
        if (latDiff <= tolerance && lngDiff <= tolerance) {
            return cityData.name;
        }
    }
    
    return 'Bilinmeyen Konum';
}

/**
 * Route waypoint'lerini şehir isimlerine çevir
 */
function convertWaypointsToCities(waypoints) {
    if (!waypoints || !Array.isArray(waypoints)) {
        return [];
    }
    
    return waypoints.map(waypoint => ({
        ...waypoint,
        cityName: findCityByCoordinates(waypoint.latitude, waypoint.longitude),
        type: waypoint.type // pickup, delivery, waypoint
    }));
}

/**
 * Optimize edilmiş rotayı şehir isimleriyle formatla
 */
function formatOptimizedRoute(routeData) {
    if (!routeData || !routeData.optimizedRoute) {
        return {
            routeText: 'Rota bulunamadı',
            cities: [],
            totalDistance: 0,
            totalTime: 0,
            fuelEstimate: 0,
            efficiency: 0
        };
    }
    
    const { optimizedRoute, totalDistance, totalTime, fuelEstimate, efficiency } = routeData;
    const waypoints = convertWaypointsToCities(optimizedRoute.waypoints);
    
    // Benzersiz şehirleri al ve sırala
    const uniqueCities = [];
    const seenCities = new Set();
    
    waypoints.forEach(waypoint => {
        if (!seenCities.has(waypoint.cityName)) {
            seenCities.add(waypoint.cityName);
            uniqueCities.push({
                name: waypoint.cityName,
                type: waypoint.type,
                coordinates: {
                    lat: waypoint.latitude,
                    lng: waypoint.longitude
                }
            });
        }
    });
    
    // Rota metnini oluştur
    const routeText = uniqueCities.map(city => city.name).join(' → ');
    
    return {
        routeText,
        cities: uniqueCities,
        waypoints: waypoints,
        totalDistance: parseFloat(totalDistance) || 0,
        totalTime: parseInt(totalTime) || 0,
        fuelEstimate: parseFloat(fuelEstimate) || 0,
        efficiency: parseFloat(efficiency) || 0,
        polyline: optimizedRoute.polyline,
        optimizedOrder: optimizedRoute.optimizedOrder || []
    };
}

/**
 * Mesafeyi formatla
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    } else {
        return `${(meters / 1000).toFixed(1)} km`;
    }
}

/**
 * Süreyi formatla
 */
function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes} dakika`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
            return `${hours} saat`;
        } else {
            return `${hours} saat ${remainingMinutes} dakika`;
        }
    }
}

/**
 * Yakıt tüketimini formatla
 */
function formatFuel(liters) {
    return `${liters.toFixed(1)} L`;
}

/**
 * Verimliliği formatla
 */
function formatEfficiency(percentage) {
    return `%${percentage.toFixed(1)}`;
}

/**
 * Route durumunu Türkçe'ye çevir
 */
function formatRouteStatus(status) {
    const statusMap = {
        'planned': 'Planlandı',
        'in_progress': 'Devam Ediyor',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi'
    };
    
    return statusMap[status] || status;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        findCityByCoordinates,
        convertWaypointsToCities,
        formatOptimizedRoute,
        formatDistance,
        formatTime,
        formatFuel,
        formatEfficiency,
        formatRouteStatus,
        TURKEY_CITIES
    };
} else {
    // Browser environment
    window.RouteHelper = {
        findCityByCoordinates,
        convertWaypointsToCities,
        formatOptimizedRoute,
        formatDistance,
        formatTime,
        formatFuel,
        formatEfficiency,
        formatRouteStatus,
        TURKEY_CITIES
    };
}
