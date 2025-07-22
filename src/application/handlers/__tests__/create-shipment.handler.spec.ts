import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateShipmentHandler } from '../create-shipment.handler';
import { CreateShipmentCommand } from '../../commands/create-shipment.command';
import { ShipmentRepository } from '../../../domain/repositories/shipment.repository';
import { Shipment } from '../../../domain/entities/shipment.entity';
import { ShipmentStatus } from '../../../domain/value-objects/shipment-status.vo';
import { ShipmentCreatedEvent } from '../../../domain/events/shipment-created.event';

describe('CreateShipmentHandler', () => {
    let handler: CreateShipmentHandler;
    let mockShipmentRepository: jest.Mocked<ShipmentRepository>;
    let mockEventBus: any;

    beforeEach(async () => {
        // Mock repository
        const mockRepo = {
            save: jest.fn(),
            findById: jest.fn(),
            findByTrackingNumber: jest.fn(),
            findAll: jest.fn(),
            findByStatus: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findByReceiver: jest.fn(),
            findBySender: jest.fn(),
            findByDateRange: jest.fn(),
        };

        // Mock event bus
        const mockEvent = {
            publish: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateShipmentHandler,
                {
                    provide: 'ShipmentRepository',
                    useValue: mockRepo,
                },
                {
                    provide: EventBus,
                    useValue: mockEvent,
                },
            ],
        }).compile();

        handler = module.get<CreateShipmentHandler>(CreateShipmentHandler);
        mockShipmentRepository = module.get('ShipmentRepository');
        mockEventBus = module.get<EventBus>(EventBus);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        const mockCommand = new CreateShipmentCommand(
            'Ahmet Yılmaz',
            'İstanbul, Türkiye',
            'Mehmet Demir',
            'Ankara, Türkiye',
            5.5,
            30,
            20,
            15,
            new Date('2024-12-31'),
        );

        it('başarılı gönderi oluşturma işlemini gerçekleştirmelidir', async () => {
            // Arrange
            const expectedShipment = new Shipment();
            expectedShipment.id = 'test-id';
            expectedShipment.trackingNumber = 'LCS-20241222-ABCD12';
            expectedShipment.senderName = mockCommand.senderName;
            expectedShipment.receiverName = mockCommand.receiverName;
            expectedShipment.status = ShipmentStatus.CREATED;
            expectedShipment.weight = mockCommand.weight;

            mockShipmentRepository.save.mockResolvedValue(expectedShipment);
            mockEventBus.publish.mockResolvedValue(undefined);

            // Act
            const result = await handler.execute(mockCommand);

            // Assert
            expect(result).toBeDefined();
            expect(result.senderName).toBe(mockCommand.senderName);
            expect(result.receiverName).toBe(mockCommand.receiverName);
            expect(result.status).toBe(ShipmentStatus.CREATED);
            expect(result.weight).toBe(mockCommand.weight);

            // Repository save metodunun çağrıldığını kontrol et
            expect(mockShipmentRepository.save).toHaveBeenCalledTimes(1);

            // Event bus'ın publish metodunun çağrıldığını kontrol et
            expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
            expect(mockEventBus.publish).toHaveBeenCalledWith(expect.any(ShipmentCreatedEvent));
        });

        it('repository hatası durumunda hata fırlatmalıdır', async () => {
            // Arrange
            const errorMessage = 'Database connection failed';
            mockShipmentRepository.save.mockRejectedValue(new Error(errorMessage));

            // Act & Assert
            await expect(handler.execute(mockCommand)).rejects.toThrow(
                `Gönderi oluşturulurken hata oluştu: ${errorMessage}`
            );

            expect(mockShipmentRepository.save).toHaveBeenCalledTimes(1);
            expect(mockEventBus.publish).not.toHaveBeenCalled();
        });

        it('benzersiz takip numarası oluşturmalıdır', async () => {
            // Arrange
            const mockShipment = new Shipment();
            mockShipment.id = 'test-id';
            mockShipmentRepository.save.mockResolvedValue(mockShipment);

            // Act
            await handler.execute(mockCommand);

            // Assert
            const saveCall = mockShipmentRepository.save.mock.calls[0][0];
            expect(saveCall.trackingNumber).toMatch(/^LCS-\d{8}-[A-Z0-9]{6}$/);
        });

        it('doğru domain event\'i publish etmelidir', async () => {
            // Arrange
            const mockShipment = new Shipment();
            mockShipment.id = 'test-id';
            mockShipment.trackingNumber = 'LCS-20241222-TEST12';
            mockShipment.senderName = mockCommand.senderName;
            mockShipment.receiverName = mockCommand.receiverName;
            mockShipment.weight = mockCommand.weight;
            mockShipment.calculateVolume = jest.fn().mockReturnValue(9000); // 30*20*15

            mockShipmentRepository.save.mockResolvedValue(mockShipment);

            // Act
            await handler.execute(mockCommand);

            // Assert
            const publishedEvent = mockEventBus.publish.mock.calls[0][0] as ShipmentCreatedEvent;
            expect(publishedEvent).toBeInstanceOf(ShipmentCreatedEvent);
            expect(publishedEvent.shipmentId).toBe(mockShipment.id);
            expect(publishedEvent.trackingNumber).toBe(mockShipment.trackingNumber);
            expect(publishedEvent.senderName).toBe(mockCommand.senderName);
            expect(publishedEvent.receiverName).toBe(mockCommand.receiverName);
            expect(publishedEvent.weight).toBe(mockCommand.weight);
            expect(publishedEvent.volume).toBe(9000);
        });

        it('opsiyonel estimatedDeliveryDate parametresi ile çalışmalıdır', async () => {
            // Arrange
            const commandWithoutDate = new CreateShipmentCommand(
                mockCommand.senderName,
                mockCommand.senderAddress,
                mockCommand.receiverName,
                mockCommand.receiverAddress,
                mockCommand.weight,
                mockCommand.length,
                mockCommand.width,
                mockCommand.height,
            );

            const mockShipment = new Shipment();
            mockShipmentRepository.save.mockResolvedValue(mockShipment);

            // Act
            const result = await handler.execute(commandWithoutDate);

            // Assert
            expect(result).toBeDefined();
            const saveCall = mockShipmentRepository.save.mock.calls[0][0];
            expect(saveCall.estimatedDeliveryDate).toBeNull();
        });

        it('oluşturulan gönderi için gerekli tüm alanları set etmelidir', async () => {
            // Arrange
            const mockShipment = new Shipment();
            mockShipmentRepository.save.mockResolvedValue(mockShipment);

            // Act
            await handler.execute(mockCommand);

            // Assert
            const saveCall = mockShipmentRepository.save.mock.calls[0][0] as Shipment;

            expect(saveCall.id).toBeDefined();
            expect(saveCall.trackingNumber).toBeDefined();
            expect(saveCall.senderName).toBe(mockCommand.senderName);
            expect(saveCall.senderAddress).toBe(mockCommand.senderAddress);
            expect(saveCall.receiverName).toBe(mockCommand.receiverName);
            expect(saveCall.receiverAddress).toBe(mockCommand.receiverAddress);
            expect(saveCall.status).toBe(ShipmentStatus.CREATED);
            expect(saveCall.weight).toBe(mockCommand.weight);
            expect(saveCall.length).toBe(mockCommand.length);
            expect(saveCall.width).toBe(mockCommand.width);
            expect(saveCall.height).toBe(mockCommand.height);
            expect(saveCall.estimatedDeliveryDate).toBe(mockCommand.estimatedDeliveryDate);
            expect(saveCall.createdAt).toBeInstanceOf(Date);
            expect(saveCall.updatedAt).toBeInstanceOf(Date);
        });
    });
}); 