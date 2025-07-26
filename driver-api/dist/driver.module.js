"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const cqrs_1 = require("@nestjs/cqrs");
const driver_entity_1 = require("./domain/entities/driver.entity");
const driver_location_entity_1 = require("./domain/entities/driver-location.entity");
const driver_assignment_entity_1 = require("./domain/entities/driver-assignment.entity");
const typeorm_driver_repository_1 = require("./infrastructure/repositories/typeorm-driver.repository");
const redis_service_1 = require("./infrastructure/redis/redis.service");
const rabbitmq_service_1 = require("./infrastructure/rabbitmq/rabbitmq.service");
const create_driver_handler_1 = require("./application/handlers/create-driver.handler");
const get_drivers_handler_1 = require("./application/handlers/get-drivers.handler");
const driver_controller_1 = require("./controllers/driver.controller");
const CommandHandlers = [
    create_driver_handler_1.CreateDriverHandler,
];
const QueryHandlers = [
    get_drivers_handler_1.GetDriversHandler,
];
let DriverModule = class DriverModule {
};
exports.DriverModule = DriverModule;
exports.DriverModule = DriverModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD', 'postgres'),
                    database: configService.get('DB_NAME', 'driver_db'),
                    entities: [driver_entity_1.Driver, driver_location_entity_1.DriverLocation, driver_assignment_entity_1.DriverAssignment],
                    synchronize: true,
                    logging: true,
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([driver_entity_1.Driver, driver_location_entity_1.DriverLocation, driver_assignment_entity_1.DriverAssignment]),
            cqrs_1.CqrsModule,
        ],
        controllers: [driver_controller_1.DriverController],
        providers: [
            redis_service_1.RedisService,
            rabbitmq_service_1.RabbitMQService,
            typeorm_driver_repository_1.TypeOrmDriverRepository,
            {
                provide: 'DriverRepository',
                useClass: typeorm_driver_repository_1.TypeOrmDriverRepository,
            },
            ...CommandHandlers,
            ...QueryHandlers,
        ],
        exports: [
            redis_service_1.RedisService,
            rabbitmq_service_1.RabbitMQService,
            'DriverRepository',
        ],
    })
], DriverModule);
//# sourceMappingURL=driver.module.js.map