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
exports.GetShipmentByIdHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const get_shipment_by_id_query_1 = require("../queries/get-shipment-by-id.query");
let GetShipmentByIdHandler = class GetShipmentByIdHandler {
    constructor(shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }
    async execute(query) {
        return await this.shipmentRepository.findById(query.id);
    }
};
exports.GetShipmentByIdHandler = GetShipmentByIdHandler;
exports.GetShipmentByIdHandler = GetShipmentByIdHandler = __decorate([
    (0, cqrs_1.QueryHandler)(get_shipment_by_id_query_1.GetShipmentByIdQuery),
    __param(0, (0, common_1.Inject)('ShipmentRepository')),
    __metadata("design:paramtypes", [Object])
], GetShipmentByIdHandler);
//# sourceMappingURL=get-shipment-by-id.handler.js.map