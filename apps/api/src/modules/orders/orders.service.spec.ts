import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { NotificationsService } from '../notifications/notifications.service';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ORD-001',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    subtotal: 99.99,
    discount: 0,
    shipping: 10,
    tax: 0,
    total: 109.99,
    currency: 'BDT',
    notes: null,
    internalNotes: null,
    trackingNumber: null,
    shippingRateId: null,
    couponId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', email: 'test@example.com', phone: null },
    items: [],
    address: null,
    statusHistory: [],
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('OrdersService', () => {
  let service: OrdersService;
  let repo: jest.Mocked<OrdersRepository>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            findMany: jest.fn(),
            findById: jest.fn(),
            findByIdAndUser: jest.fn(),
            findByUser: jest.fn(),
            updateStatus: jest.fn(),
            updateTracking: jest.fn(),
            updatePaymentStatus: jest.fn(),
            getStats: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendMulti: jest.fn().mockReturnValue(Promise.resolve()),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repo = module.get(OrdersRepository) as jest.Mocked<OrdersRepository>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
  });

  // ── getOrder ───────────────────────────────────────────────────────────────

  describe('getOrder', () => {
    it('throws NotFoundException when order does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getOrder('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('returns the order when found', async () => {
      const order = makeOrder();
      repo.findById.mockResolvedValue(order as any);
      const result = await service.getOrder('order-1');
      expect(result.id).toBe('order-1');
    });
  });

  // ── getCustomerOrder ───────────────────────────────────────────────────────

  describe('getCustomerOrder', () => {
    it('throws NotFoundException when order does not belong to user', async () => {
      repo.findByIdAndUser.mockResolvedValue(null);
      await expect(service.getCustomerOrder('order-1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('throws NotFoundException when order does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.updateStatus('order-1', { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for invalid transition PENDING → DELIVERED', async () => {
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.PENDING }) as any);
      await expect(
        service.updateStatus('order-1', { status: OrderStatus.DELIVERED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid transition DELIVERED → CONFIRMED', async () => {
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.DELIVERED }) as any);
      await expect(
        service.updateStatus('order-1', { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid transition CANCELLED → CONFIRMED', async () => {
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.CANCELLED }) as any);
      await expect(
        service.updateStatus('order-1', { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows valid transition PENDING → CONFIRMED', async () => {
      const updated = makeOrder({ status: OrderStatus.CONFIRMED });
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.PENDING }) as any);
      repo.updateStatus.mockResolvedValue(updated as any);
      const result = await service.updateStatus('order-1', { status: OrderStatus.CONFIRMED });
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(repo.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.CONFIRMED, undefined);
    });

    it('allows valid transition CONFIRMED → PACKED', async () => {
      const updated = makeOrder({ status: OrderStatus.PACKED });
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.CONFIRMED }) as any);
      repo.updateStatus.mockResolvedValue(updated as any);
      await service.updateStatus('order-1', { status: OrderStatus.PACKED });
      expect(repo.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.PACKED, undefined);
    });

    it('allows valid transition PACKED → SHIPPED', async () => {
      const updated = makeOrder({ status: OrderStatus.SHIPPED });
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.PACKED }) as any);
      repo.updateStatus.mockResolvedValue(updated as any);
      await service.updateStatus('order-1', { status: OrderStatus.SHIPPED });
      expect(repo.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.SHIPPED, undefined);
    });

    it('allows valid transition SHIPPED → DELIVERED', async () => {
      const updated = makeOrder({ status: OrderStatus.DELIVERED });
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.SHIPPED }) as any);
      repo.updateStatus.mockResolvedValue(updated as any);
      await service.updateStatus('order-1', { status: OrderStatus.DELIVERED });
      expect(repo.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.DELIVERED, undefined);
    });

    it('allows PENDING → CANCELLED', async () => {
      const updated = makeOrder({ status: OrderStatus.CANCELLED });
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.PENDING }) as any);
      repo.updateStatus.mockResolvedValue(updated as any);
      await service.updateStatus('order-1', { status: OrderStatus.CANCELLED });
      expect(repo.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.CANCELLED, undefined);
    });

    it('sends notification for status transitions that have messages', async () => {
      const updated = makeOrder({ status: OrderStatus.CONFIRMED });
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.PENDING }) as any);
      repo.updateStatus.mockResolvedValue(updated as any);
      await service.updateStatus('order-1', { status: OrderStatus.CONFIRMED });
      // notification is fire-and-forget; give the promise a tick to fire
      await new Promise((r) => setImmediate(r));
      expect(notificationsService.sendMulti).toHaveBeenCalled();
    });

    it('passes notes to the repository', async () => {
      const updated = makeOrder({ status: OrderStatus.CONFIRMED });
      repo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.PENDING }) as any);
      repo.updateStatus.mockResolvedValue(updated as any);
      await service.updateStatus('order-1', { status: OrderStatus.CONFIRMED, notes: 'Internal note' });
      expect(repo.updateStatus).toHaveBeenCalledWith('order-1', OrderStatus.CONFIRMED, 'Internal note');
    });
  });
});
