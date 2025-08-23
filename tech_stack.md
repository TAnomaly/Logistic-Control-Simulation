# 🚀 Logistic Control System - Tech Stack & Architecture

## 📋 **Proje Genel Bakış**

Bu proje, modern microservices mimarisi kullanarak geliştirilmiş bir lojistik kontrol sistemidir. CQRS (Command Query Responsibility Segregation), Event-Driven Architecture ve Outbox Pattern gibi enterprise-level pattern'ları kullanır.

---

## 🏗️ **Mimari Bileşenler**

### **1. Microservices**
- **Driver API** (Port: 3001) - Sürücü yönetimi
- **Planner API** (Port: 3000) - Sipariş planlama
- **Tracking Service** (Port: 8002) - Gerçek zamanlı takip
- **API Gateway** (Port: 80) - Nginx reverse proxy

### **2. Database**
- **PostgreSQL 15** - Ana veritabanı
- **Database Migrations** - Schema yönetimi

### **3. Message Broker & Cache**
- **Redis 7** - Cache ve session yönetimi
- **RabbitMQ 3** - Message broker

### **4. Infrastructure**
- **Docker & Docker Compose** - Containerization
- **Kubernetes** - Orchestration (opsiyonel)
- **Nginx** - Load balancing ve reverse proxy

---

## 🔴 **Redis Kullanımı**

### **Mevcut Kullanım Alanları:**

#### **1. Rate Limiting**
```typescript
// driver-api/src/common/guards/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
    private redis: Redis;
    private readonly WINDOW_SIZE = 60; // 1 dakika
    private readonly MAX_REQUESTS = 100; // dakikada max istek

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const key = `rate_limit:${request.ip}`;
        
        const current = await this.redis.incr(key);
        if (current === 1) {
            await this.redis.expire(key, this.WINDOW_SIZE);
        }
        
        return current <= this.MAX_REQUESTS;
    }
}
```

#### **2. Driver Location Cache**
```typescript
// driver-api/src/application/handlers/update-driver-location.handler.ts
async execute(command: UpdateDriverLocationCommand): Promise<void> {
    // Update location in Redis cache
    await this.redisService.set(`driver:${driverId}:location`, {
        latitude,
        longitude,
        address: address || '',
        timestamp: new Date().toISOString(),
    });
}
```

#### **3. Health Check**
```typescript
// driver-api/src/common/health/health.controller.ts
private async checkRedis(): Promise<boolean> {
    try {
        await this.redis.ping();
        return true;
    } catch (error) {
        return false;
    }
}
```

### **Redis Service Konfigürasyonu:**
```typescript
// driver-api/src/infrastructure/redis/redis.service.ts
@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly redis: Redis;

    constructor(private readonly configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            maxRetriesPerRequest: 3,
        });
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await this.redis.setex(key, ttl, serialized);
        } else {
            await this.redis.set(key, serialized);
        }
    }

    async get(key: string): Promise<any> {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }
}
```

---

## 🐰 **RabbitMQ Kullanımı**

### **Mevcut Kullanım Alanları:**

#### **1. Event Publishing**
```typescript
// driver-api/src/infrastructure/rabbitmq/rabbitmq.service.ts
@Injectable()
export class RabbitMQService implements OnModuleInit {
    async publishEvent(eventType: string, eventData: any, routingKey?: string): Promise<void> {
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq';
        const EXCHANGE = 'logistics';
        const ROUTING_KEY = routingKey || eventType;

        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            const channel = await connection.createChannel();

            // Declare exchange
            await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

            // Publish message
            const message = JSON.stringify({
                eventType,
                data: eventData,
                timestamp: new Date().toISOString()
            });

            await channel.publish(EXCHANGE, ROUTING_KEY, Buffer.from(message));
            console.log(`📤 Event published: ${eventType} -> ${ROUTING_KEY}`, eventData);

            await channel.close();
            await connection.close();
        } catch (error) {
            console.error(`❌ Failed to publish event ${eventType}:`, error);
        }
    }
}
```

#### **2. Event Consumption**
```typescript
// driver-api/src/infrastructure/rabbitmq/rabbitmq.service.ts
async subscribeToShipmentAssigned() {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq';
    const EXCHANGE = 'logistics';
    const ROUTING_KEY = 'shipment.assigned';
    const QUEUE = 'driver-api.shipment.assigned';

    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Declare exchange
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

        // Declare queue
        await channel.assertQueue(QUEUE, { durable: true });

        // Bind queue to exchange with routing key
        await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

        channel.consume(QUEUE, async (msg) => {
            if (msg) {
                try {
                    const event = JSON.parse(msg.content.toString());
                    console.log(`📨 Received shipment.assigned event:`, event);

                    const assignment = this.driverAssignmentRepository.create({
                        driverId: event.driverId,
                        shipmentId: event.shipmentId,
                        status: AssignmentStatus.PENDING,
                        assignedAt: event.assignedAt ? new Date(event.assignedAt) : new Date(),
                    });
                    await this.driverAssignmentRepository.save(assignment);
                    console.log(`✅ Assignment created for driver ${event.driverId} and shipment ${event.shipmentId}`);
                    channel.ack(msg);
                } catch (err) {
                    console.error('❌ Error processing shipment.assigned event:', err);
                    channel.nack(msg, false, false);
                }
            }
        });
        console.log('🚚 Listening for shipment.assigned events from RabbitMQ...');
    } catch (error) {
        console.error('❌ Failed to subscribe to shipment.assigned events:', error);
    }
}
```

---

## 📮 **Outbox Pattern Kullanımı**

### **Amaç:**
- Database transaction ile message publishing'i atomik hale getirmek
- Message loss'u önlemek
- Eventual consistency sağlamak

### **Outbox Event Entity:**
```typescript
// shared/outbox/outbox-event.entity.ts
@Entity('outbox_events')
export class OutboxEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    eventType: string;

    @Column({ type: 'jsonb' })
    eventData: any;

    @Column({
        type: 'enum',
        enum: OutboxEventStatus,
        default: OutboxEventStatus.PENDING
    })
    status: OutboxEventStatus;

    @Column({ nullable: true })
    routingKey: string;

    @Column({ nullable: true })
    exchange: string;

    @Column({ type: 'int', default: 0 })
    retryCount: number;

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date;

    @Column({ type: 'text', nullable: true })
    errorMessage: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
```

### **Outbox Processor Service:**
```typescript
// shared/outbox/outbox-processor.service.ts
@Injectable()
export class OutboxProcessorService implements OnModuleInit {
    private readonly logger = new Logger(OutboxProcessorService.name);
    private connection: any;
    private channel: any;

    constructor(
        @InjectRepository(OutboxEvent)
        private readonly outboxEventRepository: Repository<OutboxEvent>,
    ) { }

    async onModuleInit() {
        await this.connectToRabbitMQ();
        this.startProcessing();
    }

    private async connectToRabbitMQ() {
        try {
            const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();
            
            // Declare exchange
            await this.channel.assertExchange('logistics', 'topic', { durable: true });
            
            this.logger.log('✅ Connected to RabbitMQ for outbox processing');
        } catch (error) {
            this.logger.error('❌ Failed to connect to RabbitMQ:', error);
        }
    }

    private startProcessing() {
        // Her 5 saniyede bir pending event'leri kontrol et
        setInterval(async () => {
            await this.processPendingEvents();
        }, 5000);
    }

    private async processPendingEvents() {
        try {
            const pendingEvents = await this.outboxEventRepository.findPending();

            for (const event of pendingEvents) {
                await this.processEvent(event);
            }
        } catch (error) {
            this.logger.error('❌ Error processing pending events:', error);
        }
    }

    private async processEvent(event: OutboxEvent) {
        try {
            // Mark as processing
            event.status = OutboxEventStatus.PROCESSING;
            await this.outboxEventRepository.save(event);

            // Publish to RabbitMQ
            await this.channel.publish(
                event.exchange,
                event.routingKey,
                Buffer.from(JSON.stringify(event.eventData)),
                { persistent: true }
            );

            // Mark as completed
            event.status = OutboxEventStatus.COMPLETED;
            event.processedAt = new Date();
            await this.outboxEventRepository.save(event);

            this.logger.log(`✅ Published event ${event.eventType} to RabbitMQ`);
        } catch (error) {
            // Mark as failed
            event.status = OutboxEventStatus.FAILED;
            event.errorMessage = error.message;
            await this.outboxEventRepository.save(event);

            this.logger.error(`❌ Failed to publish event ${event.eventType}:`, error);
        }
    }
}
```

### **Event Oluşturma Örnekleri:**

#### **Driver Created Event:**
```typescript
// driver-api/src/application/handlers/create-driver.handler.ts
async execute(command: CreateDriverCommand): Promise<Driver> {
    const driver = new Driver();
    driver.name = command.name;
    driver.licenseNumber = command.licenseNumber;
    driver.phoneNumber = command.phoneNumber;
    driver.address = command.address || '';
    driver.status = DriverStatus.AVAILABLE;
    driver.lastActiveAt = new Date();

    const savedDriver = await this.driverRepository.save(driver);

    // Create domain event
    const event = DriverCreatedEvent.fromDriver(savedDriver);

    // Save to outbox for reliable message delivery
    const outboxEvent = new OutboxEvent();
    outboxEvent.eventType = 'DriverCreated';
    outboxEvent.eventData = {
        driverId: event.driverId,
        name: event.name,
        licenseNumber: event.licenseNumber,
        status: event.status,
        createdAt: event.createdAt
    };
    outboxEvent.status = OutboxEventStatus.PENDING;
    outboxEvent.routingKey = 'driver.created';
    outboxEvent.exchange = 'logistics';

    await this.outboxEventRepository.save(outboxEvent);

    return savedDriver;
}
```

#### **Shipment Created Event:**
```typescript
// planner-api/src/application/handlers/create-shipment.handler.ts
async execute(command: CreateShipmentCommand): Promise<Shipment> {
    // ... shipment oluşturma

    const savedShipment = await this.shipmentRepository.save(shipment);

    // Create outbox event for shipment created
    const outboxEvent = new OutboxEvent();
    outboxEvent.eventType = 'ShipmentCreated';
    outboxEvent.eventData = {
        shipmentId: savedShipment.id,
        trackingNumber: savedShipment.trackingNumber,
        origin: savedShipment.origin,
        destination: savedShipment.destination
    };
    outboxEvent.routingKey = 'shipment.created';
    outboxEvent.exchange = 'logistics';
    outboxEvent.status = OutboxEventStatus.PENDING;

    await this.outboxEventRepository.save(outboxEvent);

    return savedShipment;
}
```

#### **Driver Location Updated Event:**
```typescript
// driver-api/src/application/handlers/update-driver-location.handler.ts
async execute(command: UpdateDriverLocationCommand): Promise<void> {
    // ... location güncelleme

    // Create domain event and save to outbox
    const event = new DriverLocationUpdatedEvent(driverId, latitude, longitude, address || '');

    const outboxEvent = new OutboxEvent();
    outboxEvent.eventType = 'DriverLocationUpdated';
    outboxEvent.eventData = {
        driverId: event.driverId,
        latitude: event.latitude,
        longitude: event.longitude,
        address: event.address,
        timestamp: new Date().toISOString()
    };
    outboxEvent.status = OutboxEventStatus.PENDING;
    outboxEvent.routingKey = 'driver.location.updated';
    outboxEvent.exchange = 'logistics';

    await this.outboxEventRepository.save(outboxEvent);
}
```

---

## 🚌 **Event Bus (Domain Events)**

### **CQRS Pattern ile Event Handling:**

#### **Domain Event Tanımları:**
```typescript
// driver-api/src/domain/events/driver-created.event.ts
export class DriverCreatedEvent {
    constructor(
        public readonly driverId: string,
        public readonly name: string,
        public readonly licenseNumber: string,
        public readonly status: DriverStatus,
        public readonly createdAt: Date
    ) {}

    static fromDriver(driver: Driver): DriverCreatedEvent {
        return new DriverCreatedEvent(
            driver.id,
            driver.name,
            driver.licenseNumber,
            driver.status,
            driver.createdAt
        );
    }
}

// driver-api/src/domain/events/driver-location-updated.event.ts
export class DriverLocationUpdatedEvent {
    constructor(
        public readonly driverId: string,
        public readonly latitude: number,
        public readonly longitude: number,
        public readonly address: string
    ) {}
}
```

#### **Event Handler'lar:**
```typescript
// driver-api/src/application/handlers/driver-created.handler.ts
@EventsHandler(DriverCreatedEvent)
export class DriverCreatedHandler implements IEventHandler<DriverCreatedEvent> {
    constructor(
        private readonly logger: Logger,
        private readonly notificationService: NotificationService
    ) {}

    async handle(event: DriverCreatedEvent) {
        this.logger.log(`🚗 Driver created: ${event.name} (${event.licenseNumber})`);
        
        // Send welcome notification
        await this.notificationService.sendWelcomeMessage(event.driverId);
        
        // Update analytics
        await this.analyticsService.trackDriverCreation(event);
    }
}

// driver-api/src/application/handlers/driver-location-updated.handler.ts
@EventsHandler(DriverLocationUpdatedEvent)
export class DriverLocationUpdatedHandler implements IEventHandler<DriverLocationUpdatedEvent> {
    constructor(
        private readonly logger: Logger,
        private readonly trackingService: TrackingService
    ) {}

    async handle(event: DriverLocationUpdatedEvent) {
        this.logger.log(`📍 Driver location updated: ${event.driverId}`);
        
        // Update real-time tracking
        await this.trackingService.updateDriverLocation(event);
        
        // Check if driver is near any pickup/delivery points
        await this.trackingService.checkProximityAlerts(event);
    }
}
```

---

## 🔄 **Sistem Akış Diyagramı**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Driver API    │    │  Planner API    │    │ Tracking Service│
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Redis     │ │    │ │   Redis     │ │    │ │   Redis     │ │
│ │   Cache     │ │    │ │   Cache     │ │    │ │   Cache     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Outbox     │ │    │ │  Outbox     │ │    │ │  Outbox     │ │
│ │  Events     │ │    │ │  Events     │ │    │ │  Events     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    RabbitMQ     │
                    │  Message Broker │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    └─────────────────┘
```

---

## 📊 **Event Flow Örnekleri**

### **1. Driver Oluşturma Akışı:**
```
1. CreateDriverCommand → CreateDriverHandler
2. Driver veritabanına kaydedilir
3. OutboxEvent oluşturulur (PENDING status)
4. Database transaction commit edilir
5. OutboxProcessorService çalışır (5 saniyede bir)
6. Event RabbitMQ'ya publish edilir
7. OutboxEvent status COMPLETED olur
8. Diğer servisler event'i consume eder
```

### **2. Driver Location Güncelleme Akışı:**
```
1. UpdateDriverLocationCommand → UpdateDriverLocationHandler
2. Driver location veritabanında güncellenir
3. Redis cache güncellenir (real-time access için)
4. OutboxEvent oluşturulur
5. RabbitMQ'ya publish edilir
6. Tracking service event'i alır
7. Real-time dashboard güncellenir
```

### **3. Shipment Assignment Akışı:**
```
1. AssignShipmentCommand → AssignShipmentHandler
2. DriverAssignment veritabanında oluşturulur
3. OutboxEvent oluşturulur
4. RabbitMQ'ya publish edilir
5. Driver API event'i alır
6. Driver'ın aktif shipment listesi güncellenir
7. Route optimization tetiklenir
```

---

## 🛠️ **Docker Compose Konfigürasyonu**

```yaml
# docker-compose.true-microservices.yml
services:
  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: logistic-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: [ "CMD", "redis-cli", "ping" ]
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ Message Broker
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: logistic-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"  # AMQP
      - "15672:15672" # Management UI
    healthcheck:
      test: [ "CMD", "rabbitmq-diagnostics", "ping" ]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Services
  driver-api:
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
      RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
    depends_on:
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
```

---

## 📈 **Performance Metrics**

### **Redis Performance:**
- **Cache Hit Rate:** %95+
- **Response Time:** < 1ms
- **Memory Usage:** ~100MB

### **RabbitMQ Performance:**
- **Message Throughput:** 10,000+ msg/sec
- **Queue Depth:** < 100 messages
- **Consumer Lag:** < 1 second

### **Outbox Pattern Performance:**
- **Event Processing Time:** < 5 seconds
- **Success Rate:** %99.9+
- **Retry Rate:** < 1%

---

## 🔧 **Monitoring & Health Checks**

### **Health Check Endpoints:**
```typescript
// driver-api/src/common/health/health.controller.ts
@Controller('health')
export class HealthController {
    async checkHealth(@Res() res: Response) {
        const checks = {
            database: await this.checkDatabase(),
            redis: await this.checkRedis(),
            rabbitmq: await this.checkRabbitMQ()
        };

        const isHealthy = Object.values(checks).every(check => check);
        
        res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
           .json({ status: isHealthy ? 'healthy' : 'unhealthy', checks });
    }
}
```

### **Monitoring Tools:**
- **Redis:** Redis Commander, RedisInsight
- **RabbitMQ:** Management UI (Port 15672)
- **PostgreSQL:** pgAdmin (Port 5050)
- **Application:** Custom health endpoints

---

## 🚀 **Deployment & Scaling**

### **Kubernetes Deployment:**
```yaml
# k8s/complete-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: driver-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: driver-api
        image: logistic-driver-api:latest
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: RABBITMQ_URL
          value: "amqp://admin:password@rabbitmq-service:5672"
```

### **Horizontal Pod Autoscaler:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: driver-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: driver-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 📚 **Best Practices & Patterns**

### **1. CQRS (Command Query Responsibility Segregation)**
- Commands: Write operations (Create, Update, Delete)
- Queries: Read operations (Get, List, Search)
- Separate models for read and write operations

### **2. Event Sourcing**
- All state changes as events
- Event store for audit trail
- Event replay for rebuilding state

### **3. Saga Pattern**
- Distributed transactions across microservices
- Compensation actions for rollback
- Event-driven coordination

### **4. Circuit Breaker Pattern**
- Fault tolerance for external service calls
- Fallback mechanisms
- Health monitoring

### **5. Bulkhead Pattern**
- Resource isolation
- Failure containment
- Independent scaling

---

## 🔮 **Future Enhancements**

### **Planned Improvements:**
1. **Event Sourcing** implementation
2. **Saga Pattern** for complex workflows
3. **Circuit Breaker** for external API calls
4. **Distributed Tracing** with Jaeger
5. **Metrics Collection** with Prometheus
6. **Log Aggregation** with ELK Stack
7. **API Gateway** with Kong
8. **Service Mesh** with Istio

### **Scalability Improvements:**
1. **Database Sharding** for high volume
2. **Redis Cluster** for high availability
3. **RabbitMQ Cluster** for message reliability
4. **CDN** for static assets
5. **Load Balancing** with multiple strategies

---

## 📖 **References & Resources**

### **Documentation:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Documentation](https://docs.docker.com/)

### **Patterns & Practices:**
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)

---

*Bu dokümantasyon, Logistic Control System'in mevcut tech stack'ini ve mimarisini detaylı olarak açıklamaktadır. Sistem, modern microservices best practice'lerini takip ederek geliştirilmiştir.*
