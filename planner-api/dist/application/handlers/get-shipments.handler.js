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
exports.GetShipmentsHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const get_shipments_query_1 = require("../queries/get-shipments.query");
let GetShipmentsHandler = class GetShipmentsHandler {
    constructor(shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }
    async execute(query) {
        if (query.status) {
            return await this.shipmentRepository.findByStatus(query.status);
        }
        if (query.driverId) {
            return await this.shipmentRepository.findByDriverId(query.driverId);
        }
        return await this.shipmentRepository.findAll();
    }
};
exports.GetShipmentsHandler = GetShipmentsHandler;
exports.GetShipmentsHandler = GetShipmentsHandler = __decorate([
    (0, cqrs_1.QueryHandler)(get_shipments_query_1.GetShipmentsQuery),
    __param(0, (0, common_1.Inject)('ShipmentRepository')),
    __metadata("design:paramtypes", [Object])
], GetShipmentsHandler);
//# sourceMappingURL=get-shipments.handler.js.map