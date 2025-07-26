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
        this.shipments = [];
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return this.appService.getHealth();
    }
    createShipment(shipmentData) {
        const newShipment = {
            id: Date.now().toString(),
            trackingNumber: shipmentData.trackingNumber,
            origin: shipmentData.origin,
            destination: shipmentData.destination,
            description: shipmentData.description,
            weight: shipmentData.weight || 0,
            volume: shipmentData.volume || 0,
            status: 'PENDING',
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.shipments.push(newShipment);
        console.log(`📦 Shipment created: ${newShipment.trackingNumber} (${newShipment.origin} → ${newShipment.destination})`);
        return newShipment;
    }
    getShipments() {
        return this.shipments;
    }
    getShipment(id) {
        const shipment = this.shipments.find(s => s.id === id);
        if (!shipment) {
            return { error: 'Shipment not found' };
        }
        return shipment;
    }
    assignDriver(id, assignmentData) {
        const shipment = this.shipments.find(s => s.id === id);
        if (!shipment) {
            return { error: 'Shipment not found' };
        }
        shipment.assignedDriverId = assignmentData.driverId;
        shipment.status = 'ASSIGNED';
        shipment.updatedAt = new Date();
        console.log(`🚗 Shipment assigned: ${shipment.trackingNumber} → Driver ${assignmentData.driverId}`);
        return shipment;
    }
    updateStatus(id, statusData) {
        const shipment = this.shipments.find(s => s.id === id);
        if (!shipment) {
            return { error: 'Shipment not found' };
        }
        shipment.status = statusData.status;
        shipment.updatedAt = new Date();
        if (statusData.status === 'DELIVERED') {
            shipment.actualDeliveryDate = new Date();
        }
        console.log(`📦 Shipment status updated: ${shipment.trackingNumber} → ${statusData.status}`);
        return shipment;
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
    (0, common_1.Post)('shipments'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "createShipment", null);
__decorate([
    (0, common_1.Get)('shipments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], AppController.prototype, "getShipments", null);
__decorate([
    (0, common_1.Get)('shipments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AppController.prototype, "getShipment", null);
__decorate([
    (0, common_1.Put)('shipments/:id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "assignDriver", null);
__decorate([
    (0, common_1.Put)('shipments/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "updateStatus", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map