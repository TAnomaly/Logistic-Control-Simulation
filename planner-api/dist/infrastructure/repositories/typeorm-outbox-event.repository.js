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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmOutboxEventRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const outbox_event_entity_1 = require("../../domain/entities/outbox-event.entity");
let TypeOrmOutboxEventRepository = class TypeOrmOutboxEventRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async save(outboxEvent) {
        return await this.repository.save(outboxEvent);
    }
    async findById(id) {
        return await this.repository.findOne({ where: { id } });
    }
    async findPending() {
        return await this.repository.find({
            where: { status: outbox_event_entity_1.OutboxEventStatus.PENDING },
            order: { createdAt: 'ASC' }
        });
    }
    async findByEventType(eventType) {
        return await this.repository.find({ where: { eventType } });
    }
    async markAsProcessing(id) {
        await this.repository.update(id, {
            status: outbox_event_entity_1.OutboxEventStatus.PROCESSING
        });
    }
    async markAsCompleted(id) {
        await this.repository.update(id, {
            status: outbox_event_entity_1.OutboxEventStatus.COMPLETED,
            processedAt: new Date()
        });
    }
    async markAsFailed(id, errorMessage) {
        await this.repository.update(id, {
            status: outbox_event_entity_1.OutboxEventStatus.FAILED,
            errorMessage
        });
    }
    async incrementRetryCount(id) {
        await this.repository.increment({ id }, 'retryCount', 1);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
};
exports.TypeOrmOutboxEventRepository = TypeOrmOutboxEventRepository;
exports.TypeOrmOutboxEventRepository = TypeOrmOutboxEventRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(outbox_event_entity_1.OutboxEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TypeOrmOutboxEventRepository);
//# sourceMappingURL=typeorm-outbox-event.repository.js.map