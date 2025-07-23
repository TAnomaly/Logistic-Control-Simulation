import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmShipmentRepository } from '../typeorm-shipment.repository';
import { Shipment } from '../../../domain/entities/shipment.entity';
import { ShipmentStatus } from '../../../domain/value-objects/shipment-status.vo';

describe('TypeOrmShipmentRepository', () => {
    let repository: TypeOrmShipmentRepository;
    let mockTypeOrmRepo: jest.Mocked<Repository<Shipment>>;

    beforeEach(async () => {
        const mockRepo = {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TypeOrmShipmentRepository,
                {
                    provide: getRepositoryToken(Shipment),
                    useValue: mockRepo,
                },
            ],
        }).compile();

        repository = module.get<TypeOrmShipmentRepository>(TypeOrmShipmentRepository);
        mockTypeOrmRepo = module.get(getRepositoryToken(Shipment));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('save', () => {
        it('gönderiyi başarıyla kaydetmelidir', async () => {
            // Arrange
            const shipment = createMockShipment();
            mockTypeOrmRepo.save.mockResolvedValue(shipment);

            // Act
            const result = await repository.save(shipment);

            // Assert
            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(shipment);
            expect(result).toBe(shipment);
        });

        it('kaydetme hatası durumunda error fırlatmalıdır', async () => {
            // Arrange
            const shipment = createMockShipment();
            const error = new Error('Database error');
            mockTypeOrmRepo.save.mockRejectedValue(error);

            // Act & Assert
            await expect(repository.save(shipment)).rejects.toThrow('Database error');
            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(shipment);
        });
    });

    describe('findById', () => {
        it('ID ile gönderiyi bulabilmelidir', async () => {
            // Arrange
            const shipment = createMockShipment();
            mockTypeOrmRepo.findOne.mockResolvedValue(shipment);

            // Act
            const result = await repository.findById('test-id');

            // Assert
            expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'test-id' },
                relations: ['trackingEvents', 'trackingEvents.gate']
            });
            expect(result).toBe(shipment);
        });

        it('bulunamayan ID için null döndürmelidir', async () => {
            // Arrange
            mockTypeOrmRepo.findOne.mockResolvedValue(null);

            // Act
            const result = await repository.findById('non-existent-id');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findByTrackingNumber', () => {
        it('tracking number ile gönderiyi bulabilmelidir', async () => {
            // Arrange
            const shipment = createMockShipment();
            mockTypeOrmRepo.findOne.mockResolvedValue(shipment);

            // Act
            const result = await repository.findByTrackingNumber('LCS-20241222-TEST01');

            // Assert
            expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
                where: { trackingNumber: 'LCS-20241222-TEST01' },
                relations: ['trackingEvents', 'trackingEvents.gate']
            });
            expect(result).toBe(shipment);
        });

        it('bulunamayan tracking number için null döndürmelidir', async () => {
            // Arrange
            mockTypeOrmRepo.findOne.mockResolvedValue(null);

            // Act
            const result = await repository.findByTrackingNumber('NON-EXISTENT');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('sayfalama ile tüm gönderileri getirmelidir', async () => {
            // Arrange
            const shipments = [createMockShipment(), createMockShipment()];
            const total = 2;
            mockTypeOrmRepo.findAndCount.mockResolvedValue([shipments, total]);

            // Act
            const result = await repository.findAll(1, 10);

            // Assert
            expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
                relations: ['trackingEvents'],
                order: { createdAt: 'DESC' },
                skip: 0,
                take: 10
            });
            expect(result.shipments).toBe(shipments);
            expect(result.total).toBe(total);
        });

        it('sayfa 2 için doğru skip değeri kullanmalıdır', async () => {
            // Arrange
            mockTypeOrmRepo.findAndCount.mockResolvedValue([[], 0]);

            // Act
            await repository.findAll(2, 5);

            // Assert
            expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
                relations: ['trackingEvents'],
                order: { createdAt: 'DESC' },
                skip: 5, // (2-1) * 5
                take: 5
            });
        });
    });

    describe('findByStatus', () => {
        it('status\'a göre gönderileri filtrelemede doğru query kullanmalıdır', async () => {
            // Arrange
            const shipments = [createMockShipment()];
            mockTypeOrmRepo.findAndCount.mockResolvedValue([shipments, 1]);

            // Act
            const result = await repository.findByStatus('CREATED', 1, 10);

            // Assert
            expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
                where: { status: 'CREATED' },
                relations: ['trackingEvents'],
                order: { createdAt: 'DESC' },
                skip: 0,
                take: 10
            });
            expect(result.shipments).toBe(shipments);
            expect(result.total).toBe(1);
        });
    });

    describe('update', () => {
        it('gönderiyi başarıyla güncellemelidir', async () => {
            // Arrange
            const shipment = createMockShipment();
            shipment.status = ShipmentStatus.IN_TRANSIT;
            mockTypeOrmRepo.save.mockResolvedValue(shipment);

            // Act
            const result = await repository.update(shipment);

            // Assert
            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(shipment);
            expect(result).toBe(shipment);
        });
    });

    describe('delete', () => {
        it('gönderiyi başarıyla silmelidir', async () => {
            // Arrange
            mockTypeOrmRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

            // Act
            await repository.delete('test-id');

            // Assert
            expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith('test-id');
        });

        it('silinemeyen gönderi için hata fırlatmalıdır', async () => {
            // Arrange
            mockTypeOrmRepo.delete.mockResolvedValue({ affected: 0, raw: {} });

            // Act & Assert
            await expect(repository.delete('non-existent-id')).rejects.toThrow('Gönderi bulunamadı veya silinemedi');
        });
    });

    describe('findByReceiver', () => {
        it('alıcı adına göre gönderileri bulabilmelidir', async () => {
            // Arrange
            const shipments = [createMockShipment()];
            mockTypeOrmRepo.find.mockResolvedValue(shipments);

            // Act
            const result = await repository.findByReceiver('Test Alıcı');

            // Assert
            expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
                where: { receiverName: 'Test Alıcı' },
                relations: ['trackingEvents'],
                order: { createdAt: 'DESC' }
            });
            expect(result).toBe(shipments);
        });
    });

    describe('findBySender', () => {
        it('gönderici adına göre gönderileri bulabilmelidir', async () => {
            // Arrange
            const shipments = [createMockShipment()];
            mockTypeOrmRepo.find.mockResolvedValue(shipments);

            // Act
            const result = await repository.findBySender('Test Gönderici');

            // Assert
            expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
                where: { senderName: 'Test Gönderici' },
                relations: ['trackingEvents'],
                order: { createdAt: 'DESC' }
            });
            expect(result).toBe(shipments);
        });
    });

    describe('findByDateRange', () => {
        it('tarih aralığına göre gönderileri bulabilmelidir', async () => {
            // Arrange
            const shipments = [createMockShipment()];
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(shipments),
            };

            mockTypeOrmRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

            // Act
            const result = await repository.findByDateRange(startDate, endDate);

            // Assert
            expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('shipment');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('shipment.createdAt >= :startDate', { startDate });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('shipment.createdAt <= :endDate', { endDate });
            expect(result).toBe(shipments);
        });
    });

    // Helper function
    function createMockShipment(): Shipment {
        const shipment = new Shipment();
        shipment.id = 'test-id';
        shipment.trackingNumber = 'LCS-20241222-TEST01';
        shipment.senderName = 'Test Gönderici';
        shipment.senderAddress = 'İstanbul, Türkiye';
        shipment.receiverName = 'Test Alıcı';
        shipment.receiverAddress = 'Ankara, Türkiye';
        shipment.status = ShipmentStatus.CREATED;
        shipment.weight = 5.5;
        shipment.length = 30;
        shipment.width = 20;
        shipment.height = 15;
        shipment.createdAt = new Date();
        shipment.updatedAt = new Date();
        shipment.trackingEvents = [];
        return shipment;
    }
}); 