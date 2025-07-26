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
exports.CreateDriverHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const create_driver_command_1 = require("../commands/create-driver.command");
const driver_entity_1 = require("../../domain/entities/driver.entity");
const driver_created_event_1 = require("../../domain/events/driver-created.event");
let CreateDriverHandler = class CreateDriverHandler {
    constructor(driverRepository, eventBus) {
        this.driverRepository = driverRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const driver = new driver_entity_1.Driver();
        driver.name = command.name;
        driver.licenseNumber = command.licenseNumber;
        driver.phoneNumber = command.phoneNumber;
        driver.address = command.address || '';
        driver.status = driver_entity_1.DriverStatus.AVAILABLE;
        driver.lastActiveAt = new Date();
        const savedDriver = await this.driverRepository.save(driver);
        const event = driver_created_event_1.DriverCreatedEvent.fromDriver(savedDriver);
        this.eventBus.publish(event);
        return savedDriver;
    }
};
exports.CreateDriverHandler = CreateDriverHandler;
exports.CreateDriverHandler = CreateDriverHandler = __decorate([
    (0, cqrs_1.CommandHandler)(create_driver_command_1.CreateDriverCommand),
    __param(0, (0, common_1.Inject)('DriverRepository')),
    __metadata("design:paramtypes", [Object, cqrs_1.EventBus])
], CreateDriverHandler);
//# sourceMappingURL=create-driver.handler.js.map