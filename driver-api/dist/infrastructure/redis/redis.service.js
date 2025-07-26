"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.redis = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            maxRetriesPerRequest: 3,
        });
        this.redis.on('error', (error) => {
            console.error('Redis connection error:', error);
        });
        this.redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
    async set(key, value, ttl) {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
            await this.redis.setex(key, ttl, serializedValue);
        }
        else {
            await this.redis.set(key, serializedValue);
        }
    }
    async get(key) {
        const value = await this.redis.get(key);
        if (!value)
            return null;
        return JSON.parse(value);
    }
    async del(key) {
        await this.redis.del(key);
    }
    async exists(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }
    async expire(key, seconds) {
        await this.redis.expire(key, seconds);
    }
    async publish(channel, message) {
        await this.redis.publish(channel, JSON.stringify(message));
    }
    async subscribe(channel, callback) {
        const subscriber = this.redis.duplicate();
        await subscriber.subscribe(channel);
        subscriber.on('message', (ch, message) => {
            if (ch === channel) {
                callback(JSON.parse(message));
            }
        });
    }
    async healthCheck() {
        try {
            await this.redis.ping();
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map