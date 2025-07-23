import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * RedisService - Redis bağlantısı ve cache operasyonları
 * Caching, session storage ve message broker functionality sağlar
 */
@Injectable()
export class RedisService implements OnModuleInit {
    private readonly logger = new Logger(RedisService.name);
    private redis: Redis;
    private subscriber: Redis;
    private publisher: Redis;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        await this.initializeRedis();
    }

    private async initializeRedis(): Promise<void> {
        const redisConfig = {
            host: this.configService.get<string>('REDIS_HOST', 'localhost'),
            port: this.configService.get<number>('REDIS_PORT', 6379),
            password: this.configService.get<string>('REDIS_PASSWORD'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        };

        try {
            // Ana Redis bağlantısı
            this.redis = new Redis(redisConfig);

            // Pub/Sub için ayrı bağlantılar
            this.subscriber = new Redis(redisConfig);
            this.publisher = new Redis(redisConfig);

            // Bağlantı event'lerini dinle
            this.redis.on('connect', () => {
                this.logger.log('Redis bağlantısı başarıyla kuruldu');
            });

            this.redis.on('error', (error) => {
                this.logger.error('Redis bağlantı hatası:', error);
            });

            // Test bağlantısı
            await this.redis.ping();
            this.logger.log('Redis ping testi başarılı');

        } catch (error) {
            this.logger.error('Redis başlatılırken hata:', error);
            throw error;
        }
    }

    // ================== CACHE OPERATIONS ==================

    /**
     * Cache'e veri ekle
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);

            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, serializedValue);
            } else {
                await this.redis.set(key, serializedValue);
            }

            this.logger.debug(`Cache'e eklendi: ${key}`);
        } catch (error) {
            this.logger.error(`Cache set hatası: ${key}`, error);
            throw error;
        }
    }

    /**
     * Cache'den veri al
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);

            if (!value) {
                return null;
            }

            const parsed = JSON.parse(value) as T;
            this.logger.debug(`Cache'den alındı: ${key}`);
            return parsed;

        } catch (error) {
            this.logger.error(`Cache get hatası: ${key}`, error);
            return null;
        }
    }

    /**
     * Cache'den veri sil
     */
    async delete(key: string): Promise<void> {
        try {
            await this.redis.del(key);
            this.logger.debug(`Cache'den silindi: ${key}`);
        } catch (error) {
            this.logger.error(`Cache delete hatası: ${key}`, error);
        }
    }

    /**
     * Pattern'e uyan key'leri sil
     */
    async deletePattern(pattern: string): Promise<number> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }

            await this.redis.del(...keys);
            this.logger.debug(`Cache pattern silindi: ${pattern} (${keys.length} key)`);
            return keys.length;
        } catch (error) {
            this.logger.error(`Cache delete pattern hatası: ${pattern}`, error);
            return 0;
        }
    }

    /**
     * TTL (Time To Live) ayarla
     */
    async expire(key: string, ttlSeconds: number): Promise<void> {
        try {
            await this.redis.expire(key, ttlSeconds);
            this.logger.debug(`TTL ayarlandı: ${key} - ${ttlSeconds}s`);
        } catch (error) {
            this.logger.error(`TTL set hatası: ${key}`, error);
        }
    }

    /**
     * Key'in var olup olmadığını kontrol et
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(`Exists check hatası: ${key}`, error);
            return false;
        }
    }

    // ================== HASH OPERATIONS ==================

    /**
     * Hash field set et
     */
    async hset(key: string, field: string, value: any): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);
            await this.redis.hset(key, field, serializedValue);
            this.logger.debug(`Hash set: ${key}.${field}`);
        } catch (error) {
            this.logger.error(`Hash set hatası: ${key}.${field}`, error);
        }
    }

    /**
     * Hash field al
     */
    async hget<T>(key: string, field: string): Promise<T | null> {
        try {
            const value = await this.redis.hget(key, field);
            if (!value) return null;

            return JSON.parse(value) as T;
        } catch (error) {
            this.logger.error(`Hash get hatası: ${key}.${field}`, error);
            return null;
        }
    }

    /**
     * Hash'teki tüm field'ları al
     */
    async hgetall<T>(key: string): Promise<Record<string, T> | null> {
        try {
            const hashData = await this.redis.hgetall(key);
            if (Object.keys(hashData).length === 0) return null;

            const result: Record<string, T> = {};
            for (const [field, value] of Object.entries(hashData)) {
                result[field] = JSON.parse(value) as T;
            }

            return result;
        } catch (error) {
            this.logger.error(`Hash getall hatası: ${key}`, error);
            return null;
        }
    }

    // ================== LIST OPERATIONS ==================

    /**
     * List'e sağdan eleman ekle
     */
    async rpush(key: string, value: any): Promise<number> {
        try {
            const serializedValue = JSON.stringify(value);
            const length = await this.redis.rpush(key, serializedValue);
            this.logger.debug(`List'e eklendi: ${key} (uzunluk: ${length})`);
            return length;
        } catch (error) {
            this.logger.error(`List push hatası: ${key}`, error);
            return 0;
        }
    }

    /**
     * List'ten soldan eleman al
     */
    async lpop<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.lpop(key);
            if (!value) return null;

            return JSON.parse(value) as T;
        } catch (error) {
            this.logger.error(`List pop hatası: ${key}`, error);
            return null;
        }
    }

    /**
     * List uzunluğunu al
     */
    async llen(key: string): Promise<number> {
        try {
            return await this.redis.llen(key);
        } catch (error) {
            this.logger.error(`List length hatası: ${key}`, error);
            return 0;
        }
    }

    // ================== PUB/SUB OPERATIONS ==================

    /**
     * Channel'a mesaj publish et
     */
    async publish(channel: string, message: any): Promise<void> {
        try {
            const serializedMessage = JSON.stringify(message);
            await this.publisher.publish(channel, serializedMessage);
            this.logger.debug(`Mesaj publish edildi: ${channel}`);
        } catch (error) {
            this.logger.error(`Publish hatası: ${channel}`, error);
        }
    }

    /**
     * Channel'ı dinle
     */
    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        try {
            await this.subscriber.subscribe(channel);

            this.subscriber.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    try {
                        const parsedMessage = JSON.parse(message);
                        callback(parsedMessage);
                    } catch (error) {
                        this.logger.error(`Message parse hatası: ${channel}`, error);
                    }
                }
            });

            this.logger.log(`Channel dinleniyor: ${channel}`);
        } catch (error) {
            this.logger.error(`Subscribe hatası: ${channel}`, error);
        }
    }

    /**
     * Channel dinlemeyi durdur
     */
    async unsubscribe(channel: string): Promise<void> {
        try {
            await this.subscriber.unsubscribe(channel);
            this.logger.log(`Channel dinleme durduruldu: ${channel}`);
        } catch (error) {
            this.logger.error(`Unsubscribe hatası: ${channel}`, error);
        }
    }

    // ================== UTILITY METHODS ==================

    /**
     * Redis connection durumunu kontrol et
     */
    async ping(): Promise<boolean> {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        } catch (error) {
            this.logger.error('Redis ping hatası:', error);
            return false;
        }
    }

    /**
     * Redis istatistiklerini al
     */
    async getInfo(): Promise<Record<string, string>> {
        try {
            const info = await this.redis.info();
            const lines = info.split('\r\n');
            const result: Record<string, string> = {};

            for (const line of lines) {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    result[key] = value;
                }
            }

            return result;
        } catch (error) {
            this.logger.error('Redis info hatası:', error);
            return {};
        }
    }

    /**
     * Cache temizle
     */
    async flushAll(): Promise<void> {
        try {
            await this.redis.flushall();
            this.logger.warn('Tüm cache temizlendi');
        } catch (error) {
            this.logger.error('Cache flush hatası:', error);
        }
    }

    /**
     * Raw Redis client'ını al (gelişmiş kullanım için)
     */
    getClient(): Redis {
        return this.redis;
    }

    /**
     * Modül kapanırken bağlantıları temizle
     */
    async onModuleDestroy(): Promise<void> {
        try {
            await this.redis.disconnect();
            await this.subscriber.disconnect();
            await this.publisher.disconnect();
            this.logger.log('Redis bağlantıları kapatıldı');
        } catch (error) {
            this.logger.error('Redis disconnect hatası:', error);
        }
    }
} 