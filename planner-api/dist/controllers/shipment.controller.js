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
exports.ShipmentController = exports.AssignShipmentDto = exports.CreateShipmentDto = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const create_shipment_command_1 = require("../application/commands/create-shipment.command");
const assign_shipment_command_1 = require("../application/commands/assign-shipment.command");
const get_shipments_query_1 = require("../application/queries/get-shipments.query");
const get_shipment_by_id_query_1 = require("../application/queries/get-shipment-by-id.query");
const shipment_entity_1 = require("../domain/entities/shipment.entity");
class CreateShipmentDto {
}
exports.CreateShipmentDto = CreateShipmentDto;
class AssignShipmentDto {
}
exports.AssignShipmentDto = AssignShipmentDto;
let ShipmentController = class ShipmentController {
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async createShipment(dto) {
        const command = new create_shipment_command_1.CreateShipmentCommand(dto.trackingNumber, dto.origin, dto.destination, dto.description, dto.weight, dto.volume, dto.estimatedDeliveryDate);
        return await this.commandBus.execute(command);
    }
    async assignShipment(id, dto) {
        const command = new assign_shipment_command_1.AssignShipmentCommand(id, dto.driverId);
        return await this.commandBus.execute(command);
    }
    async getShipments(status, driverId) {
        const query = new get_shipments_query_1.GetShipmentsQuery(status, driverId);
        return await this.queryBus.execute(query);
    }
    async getShipmentById(id) {
        const query = new get_shipment_by_id_query_1.GetShipmentByIdQuery(id);
        return await this.queryBus.execute(query);
    }
    async getShipmentByTrackingNumber(trackingNumber) {
        const query = new get_shipment_by_id_query_1.GetShipmentByIdQuery(trackingNumber);
        return await this.queryBus.execute(query);
    }
};
exports.ShipmentController = ShipmentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateShipmentDto]),
    __metadata("design:returntype", Promise)
], ShipmentController.prototype, "createShipment", null);
__decorate([
    (0, common_1.Put)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignShipmentDto]),
    __metadata("design:returntype", Promise)
], ShipmentController.prototype, "assignShipment", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('driverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ShipmentController.prototype, "getShipments", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShipmentController.prototype, "getShipmentById", null);
__decorate([
    (0, common_1.Get)('tracking/:trackingNumber'),
    __param(0, (0, common_1.Param)('trackingNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShipmentController.prototype, "getShipmentByTrackingNumber", null);
exports.ShipmentController = ShipmentController = __decorate([
    (0, common_1.Controller)('shipments'),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus])
], ShipmentController);
//# sourceMappingURL=shipment.controller.js.map