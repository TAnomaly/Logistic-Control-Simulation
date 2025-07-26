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
exports.DriverAssignment = exports.AssignmentStatus = void 0;
const typeorm_1 = require("typeorm");
var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["PENDING"] = "pending";
    AssignmentStatus["ACCEPTED"] = "accepted";
    AssignmentStatus["REJECTED"] = "rejected";
    AssignmentStatus["IN_PROGRESS"] = "in_progress";
    AssignmentStatus["COMPLETED"] = "completed";
    AssignmentStatus["CANCELLED"] = "cancelled";
})(AssignmentStatus || (exports.AssignmentStatus = AssignmentStatus = {}));
let DriverAssignment = class DriverAssignment {
};
exports.DriverAssignment = DriverAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DriverAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DriverAssignment.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DriverAssignment.prototype, "shipmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssignmentStatus,
        default: AssignmentStatus.PENDING
    }),
    __metadata("design:type", String)
], DriverAssignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], DriverAssignment.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], DriverAssignment.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], DriverAssignment.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], DriverAssignment.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DriverAssignment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], DriverAssignment.prototype, "estimatedDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], DriverAssignment.prototype, "actualDuration", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriverAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DriverAssignment.prototype, "updatedAt", void 0);
exports.DriverAssignment = DriverAssignment = __decorate([
    (0, typeorm_1.Entity)('driver_assignments')
], DriverAssignment);
//# sourceMappingURL=driver-assignment.entity.js.map