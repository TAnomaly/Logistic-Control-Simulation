"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlannerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const cqrs_1 = require("@nestjs/cqrs");
const shipment_entity_1 = require("./domain/entities/shipment.entity");
const tracking_event_entity_1 = require("./domain/entities/tracking-event.entity");
const outbox_event_entity_1 = require("./domain/entities/outbox-event.entity");
const typeorm_shipment_repository_1 = require("./infrastructure/repositories/typeorm-shipment.repository");
const typeorm_tracking_event_repository_1 = require("./infrastructure/repositories/typeorm-tracking-event.repository");
const typeorm_outbox_event_repository_1 = require("./infrastructure/repositories/typeorm-outbox-event.repository");
const redis_service_1 = require("./infrastructure/redis/redis.service");
const rabbitmq_service_1 = require("./infrastructure/rabbitmq/rabbitmq.service");
const create_shipment_handler_1 = require("./application/handlers/create-shipment.handler");
const assign_shipment_handler_1 = require("./application/handlers/assign-shipment.handler");
const get_shipments_handler_1 = require("./application/handlers/get-shipments.handler");
const get_shipment_by_id_handler_1 = require("./application/handlers/get-shipment-by-id.handler");
const shipment_controller_1 = require("./controllers/shipment.controller");
const CommandHandlers = [
    create_shipment_handler_1.CreateShipmentHandler,
    assign_shipment_handler_1.AssignShipmentHandler,
];
const QueryHandlers = [
    get_shipments_handler_1.GetShipmentsHandler,
    get_shipment_by_id_handler_1.GetShipmentByIdHandler,
];
let PlannerModule = class PlannerModule {
};
exports.PlannerModule = PlannerModule;
exports.PlannerModule = PlannerModule = __decorate([
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
                    database: configService.get('DB_NAME', 'planner_db'),
                    entities: [shipment_entity_1.Shipment, tracking_event_entity_1.TrackingEvent, outbox_event_entity_1.OutboxEvent],
                    synchronize: true,
                    logging: true,
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([shipment_entity_1.Shipment, tracking_event_entity_1.TrackingEvent, outbox_event_entity_1.OutboxEvent]),
            cqrs_1.CqrsModule,
        ],
        controllers: [shipment_controller_1.ShipmentController],
        providers: [
            redis_service_1.RedisService,
            rabbitmq_service_1.RabbitMQService,
            typeorm_shipment_repository_1.TypeOrmShipmentRepository,
            typeorm_tracking_event_repository_1.TypeOrmTrackingEventRepository,
            typeorm_outbox_event_repository_1.TypeOrmOutboxEventRepository,
            {
                provide: 'ShipmentRepository',
                useClass: typeorm_shipment_repository_1.TypeOrmShipmentRepository,
            },
            {
                provide: 'TrackingEventRepository',
                useClass: typeorm_tracking_event_repository_1.TypeOrmTrackingEventRepository,
            },
            {
                provide: 'OutboxEventRepository',
                useClass: typeorm_outbox_event_repository_1.TypeOrmOutboxEventRepository,
            },
            ...CommandHandlers,
            ...QueryHandlers,
        ],
        exports: [
            redis_service_1.RedisService,
            rabbitmq_service_1.RabbitMQService,
            'ShipmentRepository',
            'TrackingEventRepository',
            'OutboxEventRepository',
        ],
    })
], PlannerModule);
//# sourceMappingURL=planner.module.js.map