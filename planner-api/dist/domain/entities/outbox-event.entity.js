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
exports.OutboxEvent = exports.OutboxEventStatus = void 0;
const typeorm_1 = require("typeorm");
var OutboxEventStatus;
(function (OutboxEventStatus) {
    OutboxEventStatus["PENDING"] = "pending";
    OutboxEventStatus["PROCESSING"] = "processing";
    OutboxEventStatus["COMPLETED"] = "completed";
    OutboxEventStatus["FAILED"] = "failed";
})(OutboxEventStatus || (exports.OutboxEventStatus = OutboxEventStatus = {}));
let OutboxEvent = class OutboxEvent {
};
exports.OutboxEvent = OutboxEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], OutboxEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OutboxEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], OutboxEvent.prototype, "eventData", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: OutboxEventStatus,
        default: OutboxEventStatus.PENDING
    }),
    __metadata("design:type", String)
], OutboxEvent.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OutboxEvent.prototype, "routingKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], OutboxEvent.prototype, "exchange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], OutboxEvent.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], OutboxEvent.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], OutboxEvent.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], OutboxEvent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], OutboxEvent.prototype, "updatedAt", void 0);
exports.OutboxEvent = OutboxEvent = __decorate([
    (0, typeorm_1.Entity)('outbox_events')
], OutboxEvent);
//# sourceMappingURL=outbox-event.entity.js.map