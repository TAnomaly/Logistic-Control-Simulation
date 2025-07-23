import { RedisService } from './redis.service';

/**
 * Cache decorator - Method sonuçlarını Redis'te cache'ler
 * @param ttlSeconds - Cache süresi (saniye)
 * @param keyPrefix - Cache key prefix'i
 */
export function Cache(ttlSeconds: number = 300, keyPrefix: string = '') {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Redis service'i dependency injection'dan al
            const redisService: RedisService = (this as any).redisService;

            if (!redisService) {
                // Redis service yoksa cache'leme yapmadan method'u çalıştır
                return await method.apply(this, args);
            }

            // Cache key oluştur
            const cacheKey = generateCacheKey(target.constructor.name, propertyName, args, keyPrefix);

            try {
                // Önce cache'den kontrol et
                const cachedResult = await redisService.get(cacheKey);
                if (cachedResult !== null) {
                    return cachedResult;
                }

                // Cache'de yoksa method'u çalıştır
                const result = await method.apply(this, args);

                // Sonucu cache'le (undefined değerlerini cache'leme)
                if (result !== undefined) {
                    await redisService.set(cacheKey, result, ttlSeconds);
                }

                return result;
            } catch (error) {
                // Cache hatası durumunda method'u normal çalıştır
                console.error(`Cache decorator hatası: ${cacheKey}`, error);
                return await method.apply(this, args);
            }
        };

        return descriptor;
    };
}

/**
 * Cache invalidation decorator - Cache'i temizler
 * @param keyPattern - Temizlenecek key pattern'i
 */
export function CacheInvalidate(keyPattern: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const result = await method.apply(this, args);

            // Redis service'i al
            const redisService: RedisService = (this as any).redisService;

            if (redisService) {
                try {
                    // Pattern'e uyan cache'leri temizle
                    const pattern = interpolatePattern(keyPattern, args);
                    await redisService.deletePattern(pattern);
                } catch (error) {
                    console.error(`Cache invalidation hatası: ${keyPattern}`, error);
                }
            }

            return result;
        };

        return descriptor;
    };
}

/**
 * Cache key oluştur
 */
function generateCacheKey(
    className: string,
    methodName: string,
    args: any[],
    keyPrefix: string
): string {
    const argsHash = args.length > 0 ? hashArguments(args) : 'no-args';
    const prefix = keyPrefix ? `${keyPrefix}:` : '';
    return `${prefix}cache:${className}:${methodName}:${argsHash}`;
}

/**
 * Method argumentlerinden hash oluştur
 */
function hashArguments(args: any[]): string {
    try {
        const serialized = JSON.stringify(args);
        // Basit hash fonksiyonu
        let hash = 0;
        for (let i = 0; i < serialized.length; i++) {
            const char = serialized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer'a dönüştür
        }
        return Math.abs(hash).toString(36);
    } catch (error) {
        // JSON serialize edilemeyen argumentler için fallback
        return args.map(arg => typeof arg).join('-');
    }
}

/**
 * Pattern string'ini interpolate et
 */
function interpolatePattern(pattern: string, args: any[]): string {
    let interpolated = pattern;

    // {0}, {1}, {2} şeklindeki placeholderları değiştir
    args.forEach((arg, index) => {
        const placeholder = `{${index}}`;
        if (interpolated.includes(placeholder)) {
            interpolated = interpolated.replace(placeholder, String(arg));
        }
    });

    return interpolated;
}

/**
 * Cache eviction strategy decorator
 * @param strategy - 'LRU' | 'LFU' | 'TTL'
 */
export function CacheEvict(strategy: 'LRU' | 'LFU' | 'TTL' = 'TTL') {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const result = await method.apply(this, args);

            const redisService: RedisService = (this as any).redisService;

            if (redisService && strategy === 'TTL') {
                // TTL stratejisi için eski cache'leri temizle
                // Bu örnekte basit implementation, gerçek projede daha sofistike olabilir
                try {
                    const className = target.constructor.name;
                    const pattern = `cache:${className}:*`;
                    await redisService.deletePattern(pattern);
                } catch (error) {
                    console.error('Cache eviction hatası:', error);
                }
            }

            return result;
        };

        return descriptor;
    };
} 