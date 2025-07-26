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
exports.CreateShipmentHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const create_shipment_command_1 = require("../commands/create-shipment.command");
const shipment_entity_1 = require("../../domain/entities/shipment.entity");
const shipment_created_event_1 = require("../../domain/events/shipment-created.event");
const outbox_event_entity_1 = require("../../domain/entities/outbox-event.entity");
let CreateShipmentHandler = class CreateShipmentHandler {
    constructor(shipmentRepository, outboxEventRepository, eventBus) {
        this.shipmentRepository = shipmentRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const shipment = new shipment_entity_1.Shipment();
        shipment.trackingNumber = command.trackingNumber;
        shipment.origin = command.origin;
        shipment.destination = command.destination;
        shipment.description = command.description || '';
        shipment.weight = command.weight;
        shipment.volume = command.volume;
        shipment.status = shipment_entity_1.ShipmentStatus.PENDING;
        shipment.estimatedDeliveryDate = command.estimatedDeliveryDate || new Date();
        const savedShipment = await this.shipmentRepository.save(shipment);
        const event = shipment_created_event_1.ShipmentCreatedEvent.fromShipment(savedShipment);
        const outboxEvent = new outbox_event_entity_1.OutboxEvent();
        outboxEvent.eventType = 'ShipmentCreated';
        outboxEvent.eventData = event;
        outboxEvent.status = outbox_event_entity_1.OutboxEventStatus.PENDING;
        outboxEvent.routingKey = 'shipment.created';
        outboxEvent.exchange = 'logistics';
        await this.outboxEventRepository.save(outboxEvent);
        this.eventBus.publish(event);
        return savedShipment;
    }
};
exports.CreateShipmentHandler = CreateShipmentHandler;
exports.CreateShipmentHandler = CreateShipmentHandler = __decorate([
    (0, cqrs_1.CommandHandler)(create_shipment_command_1.CreateShipmentCommand),
    __param(0, (0, common_1.Inject)('ShipmentRepository')),
    __param(1, (0, common_1.Inject)('OutboxEventRepository')),
    __metadata("design:paramtypes", [Object, Object, cqrs_1.EventBus])
], CreateShipmentHandler);
//# sourceMappingURL=create-shipment.handler.js.map