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
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RabbitMQService = class RabbitMQService {
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        console.log('✅ RabbitMQ service initialized (placeholder)');
    }
    async onModuleDestroy() {
        console.log('✅ RabbitMQ service destroyed');
    }
    async publishEvent(eventType, eventData, routingKey) {
        console.log(`📤 Event published: ${eventType} -> ${routingKey || 'default'}`, eventData);
    }
    async consumeEvents(queueName, callback) {
        console.log(`👂 Consumer registered for queue: ${queueName}`);
    }
    async bindQueueToExchange(queueName, exchange, routingKey) {
        console.log(`🔗 Queue bound: ${queueName} to ${exchange} with key: ${routingKey}`);
    }
    async getQueueInfo(queueName) {
        return { queue: queueName, messageCount: 0 };
    }
    async purgeQueue(queueName) {
        console.log(`🧹 Queue purged: ${queueName}`);
    }
    async healthCheck() {
        return true;
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map