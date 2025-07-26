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
exports.TypeOrmShipmentRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shipment_entity_1 = require("../../domain/entities/shipment.entity");
let TypeOrmShipmentRepository = class TypeOrmShipmentRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async save(shipment) {
        return await this.repository.save(shipment);
    }
    async findById(id) {
        return await this.repository.findOne({
            where: { id },
            relations: ['trackingEvents']
        });
    }
    async findByTrackingNumber(trackingNumber) {
        return await this.repository.findOne({
            where: { trackingNumber },
            relations: ['trackingEvents']
        });
    }
    async findByStatus(status) {
        return await this.repository.find({
            where: { status },
            relations: ['trackingEvents']
        });
    }
    async findByDriverId(driverId) {
        return await this.repository.find({
            where: { assignedDriverId: driverId },
            relations: ['trackingEvents']
        });
    }
    async findAll() {
        return await this.repository.find({
            relations: ['trackingEvents']
        });
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async updateStatus(id, status) {
        await this.repository.update(id, { status });
        const shipment = await this.findById(id);
        if (!shipment) {
            throw new Error('Shipment not found');
        }
        return shipment;
    }
    async assignDriver(id, driverId) {
        await this.repository.update(id, {
            assignedDriverId: driverId,
            status: shipment_entity_1.ShipmentStatus.ASSIGNED
        });
        const shipment = await this.findById(id);
        if (!shipment) {
            throw new Error('Shipment not found');
        }
        return shipment;
    }
};
exports.TypeOrmShipmentRepository = TypeOrmShipmentRepository;
exports.TypeOrmShipmentRepository = TypeOrmShipmentRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shipment_entity_1.Shipment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TypeOrmShipmentRepository);
//# sourceMappingURL=typeorm-shipment.repository.js.map