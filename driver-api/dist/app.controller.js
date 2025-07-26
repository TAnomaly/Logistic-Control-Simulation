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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
        this.drivers = [];
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return this.appService.getHealth();
    }
    createDriver(driverData) {
        const newDriver = {
            id: Date.now().toString(),
            name: driverData.name,
            licenseNumber: driverData.licenseNumber,
            phoneNumber: driverData.phoneNumber,
            address: driverData.address,
            status: 'AVAILABLE',
            currentLocation: {
                latitude: 0,
                longitude: 0,
                address: ''
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.drivers.push(newDriver);
        console.log(`🚗 Driver created: ${newDriver.name} (${newDriver.licenseNumber})`);
        return newDriver;
    }
    getDrivers() {
        return this.drivers;
    }
    getDriver(id) {
        const driver = this.drivers.find(d => d.id === id);
        if (!driver) {
            return { error: 'Driver not found' };
        }
        return driver;
    }
    updateDriverLocation(id, locationData) {
        const driver = this.drivers.find(d => d.id === id);
        if (!driver) {
            return { error: 'Driver not found' };
        }
        driver.currentLocation = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address || ''
        };
        driver.updatedAt = new Date();
        console.log(`📍 Driver location updated: ${driver.name} at ${locationData.latitude}, ${locationData.longitude}`);
        return driver;
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Post)('drivers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "createDriver", null);
__decorate([
    (0, common_1.Get)('drivers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], AppController.prototype, "getDrivers", null);
__decorate([
    (0, common_1.Get)('drivers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AppController.prototype, "getDriver", null);
__decorate([
    (0, common_1.Put)('drivers/:id/location'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "updateDriverLocation", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map