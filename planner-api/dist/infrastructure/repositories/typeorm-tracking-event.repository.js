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
exports.TypeOrmTrackingEventRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tracking_event_entity_1 = require("../../domain/entities/tracking-event.entity");
let TypeOrmTrackingEventRepository = class TypeOrmTrackingEventRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async save(trackingEvent) {
        return await this.repository.save(trackingEvent);
    }
    async findById(id) {
        return await this.repository.findOne({
            where: { id },
            relations: ['shipment']
        });
    }
    async findByShipmentId(shipmentId) {
        return await this.repository.find({
            where: { shipmentId },
            relations: ['shipment'],
            order: { eventTimestamp: 'DESC' }
        });
    }
    async findByEventType(eventType) {
        return await this.repository.find({
            where: { eventType },
            relations: ['shipment']
        });
    }
    async findByDriverId(driverId) {
        return await this.repository.find({
            where: { driverId },
            relations: ['shipment'],
            order: { eventTimestamp: 'DESC' }
        });
    }
    async findLatestByShipmentId(shipmentId) {
        return await this.repository.findOne({
            where: { shipmentId },
            relations: ['shipment'],
            order: { eventTimestamp: 'DESC' }
        });
    }
    async findAll() {
        return await this.repository.find({
            relations: ['shipment'],
            order: { eventTimestamp: 'DESC' }
        });
    }
};
exports.TypeOrmTrackingEventRepository = TypeOrmTrackingEventRepository;
exports.TypeOrmTrackingEventRepository = TypeOrmTrackingEventRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tracking_event_entity_1.TrackingEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TypeOrmTrackingEventRepository);
//# sourceMappingURL=typeorm-tracking-event.repository.js.map