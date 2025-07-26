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
exports.DriverController = exports.UpdateLocationDto = exports.CreateDriverDto = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const create_driver_command_1 = require("../application/commands/create-driver.command");
const update_driver_location_command_1 = require("../application/commands/update-driver-location.command");
const get_drivers_query_1 = require("../application/queries/get-drivers.query");
const driver_entity_1 = require("../domain/entities/driver.entity");
class CreateDriverDto {
}
exports.CreateDriverDto = CreateDriverDto;
class UpdateLocationDto {
}
exports.UpdateLocationDto = UpdateLocationDto;
let DriverController = class DriverController {
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async createDriver(dto) {
        const command = new create_driver_command_1.CreateDriverCommand(dto.name, dto.licenseNumber, dto.phoneNumber, dto.address);
        return await this.commandBus.execute(command);
    }
    async updateLocation(id, dto) {
        const command = new update_driver_location_command_1.UpdateDriverLocationCommand(id, dto.latitude, dto.longitude, dto.address, dto.speed, dto.heading);
        return await this.commandBus.execute(command);
    }
    async getDrivers(status) {
        const query = new get_drivers_query_1.GetDriversQuery(status);
        return await this.queryBus.execute(query);
    }
    async getAvailableDrivers() {
        const query = new get_drivers_query_1.GetDriversQuery(driver_entity_1.DriverStatus.AVAILABLE);
        return await this.queryBus.execute(query);
    }
};
exports.DriverController = DriverController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateDriverDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "createDriver", null);
__decorate([
    (0, common_1.Put)(':id/location'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateLocationDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDrivers", null);
__decorate([
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getAvailableDrivers", null);
exports.DriverController = DriverController = __decorate([
    (0, common_1.Controller)('drivers'),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus])
], DriverController);
//# sourceMappingURL=driver.controller.js.map