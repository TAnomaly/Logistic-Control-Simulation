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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingEvent = exports.TrackingEventType = void 0;
const typeorm_1 = require("typeorm");
const shipment_entity_1 = require("./shipment.entity");
var TrackingEventType;
(function (TrackingEventType) {
    TrackingEventType["CREATED"] = "created";
    TrackingEventType["ASSIGNED"] = "assigned";
    TrackingEventType["PICKED_UP"] = "picked_up";
    TrackingEventType["IN_TRANSIT"] = "in_transit";
    TrackingEventType["OUT_FOR_DELIVERY"] = "out_for_delivery";
    TrackingEventType["DELIVERED"] = "delivered";
    TrackingEventType["FAILED_DELIVERY"] = "failed_delivery";
    TrackingEventType["CANCELLED"] = "cancelled";
})(TrackingEventType || (exports.TrackingEventType = TrackingEventType = {}));
let TrackingEvent = class TrackingEvent {
};
exports.TrackingEvent = TrackingEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrackingEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrackingEvent.prototype, "shipmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shipment_entity_1.Shipment, shipment => shipment.trackingEvents),
    (0, typeorm_1.JoinColumn)({ name: 'shipmentId' }),
    __metadata("design:type", shipment_entity_1.Shipment)
], TrackingEvent.prototype, "shipment", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TrackingEventType
    }),
    __metadata("design:type", String)
], TrackingEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TrackingEvent.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TrackingEvent.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TrackingEvent.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], TrackingEvent.prototype, "eventTimestamp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TrackingEvent.prototype, "createdAt", void 0);
exports.TrackingEvent = TrackingEvent = __decorate([
    (0, typeorm_1.Entity)('tracking_events')
], TrackingEvent);
//# sourceMappingURL=tracking-event.entity.js.map