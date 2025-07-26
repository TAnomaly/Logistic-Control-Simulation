"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverCreatedEvent = void 0;
class DriverCreatedEvent {
    constructor(driverId, name, licenseNumber, status, createdAt) {
        this.driverId = driverId;
        this.name = name;
        this.licenseNumber = licenseNumber;
        this.status = status;
        this.createdAt = createdAt;
    }
    static fromDriver(driver) {
        return new DriverCreatedEvent(driver.id, driver.name, driver.licenseNumber, driver.status, driver.createdAt);
    }
}
exports.DriverCreatedEvent = DriverCreatedEvent;
//# sourceMappingURL=driver-created.event.js.map