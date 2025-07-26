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
exports.TypeOrmDriverRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../../domain/entities/driver.entity");
let TypeOrmDriverRepository = class TypeOrmDriverRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async save(driver) {
        return await this.repository.save(driver);
    }
    async findById(id) {
        return await this.repository.findOne({
            where: { id },
            relations: ['locationHistory']
        });
    }
    async findByLicenseNumber(licenseNumber) {
        return await this.repository.findOne({
            where: { licenseNumber },
            relations: ['locationHistory']
        });
    }
    async findByStatus(status) {
        return await this.repository.find({
            where: { status },
            relations: ['locationHistory']
        });
    }
    async findAll() {
        return await this.repository.find({
            relations: ['locationHistory']
        });
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async updateStatus(id, status) {
        await this.repository.update(id, {
            status,
            lastActiveAt: new Date()
        });
        const driver = await this.findById(id);
        if (!driver) {
            throw new Error('Driver not found');
        }
        return driver;
    }
    async updateLocation(id, latitude, longitude, address) {
        const currentLocation = {
            latitude,
            longitude,
            address: address || ''
        };
        await this.repository.update(id, {
            currentLocation,
            lastActiveAt: new Date()
        });
        const driver = await this.findById(id);
        if (!driver) {
            throw new Error('Driver not found');
        }
        return driver;
    }
};
exports.TypeOrmDriverRepository = TypeOrmDriverRepository;
exports.TypeOrmDriverRepository = TypeOrmDriverRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TypeOrmDriverRepository);
//# sourceMappingURL=typeorm-driver.repository.js.map