import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { CheckoutService } from './checkout.service';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeCartResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cart-1',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: null,
        product: { id: 'prod-1', name: 'Classic Shirt', slug: 'classic-shirt', imageUrl: null, price: 99.99, stock: 10 },
        variant: null,
        quantity: 1,
        unitPrice: 99.99,
        totalPrice: 99.99,
      },
    ],
    subtotal: 99.99,
    itemCount: 1,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 99.99,
    couponCode: null,
    ...overrides,
  };
}

function makeShippingRate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rate-1',
    name: 'Standard Delivery',
    rate: 10,
    isFree: false,
    estimatedDays: 3,
    minOrderAmt: 0,
    maxOrderAmt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCoupon(overrides: Record<string, unknown> = {}) {
  return {
    id: 'coupon-1',
    code: 'SAVE20',
    type: CouponType.PERCENTAGE,
    value: 20,
    maxDiscount: null,
    minOrderAmt: 0,
    usageLimit: null,
    usageLimitPerUser: null,
    usedCount: 0,
    isActive: true,
    startsAt: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CheckoutService', () => {
  let service: CheckoutService;
  let cartService: jest.Mocked<CartService>;
  let prisma: {
    shippingRate: { findUnique: jest.Mock };
    coupon: { findUnique: jest.Mock };
    couponUsage: { count: jest.Mock };
    product: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: CartService,
          useValue: {
            getCart: jest.fn(),
            clearCart: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendMulti: jest.fn().mockReturnValue(Promise.resolve()),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            shippingRate: { findUnique: jest.fn() },
            coupon: { findUnique: jest.fn() },
            couponUsage: { count: jest.fn().mockResolvedValue(0) },
            product: { findUnique: jest.fn() },
            user: { findUnique: jest.fn() },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    cartService = module.get(CartService) as jest.Mocked<CartService>;
    prisma = module.get<PrismaService>(PrismaService) as unknown as typeof prisma;
  });

  // ── getSummary — empty cart ────────────────────────────────────────────────

  describe('getSummary — empty cart', () => {
    it('throws BadRequestException when cart is empty', async () => {
      cartService.getCart.mockResolvedValue({ ...makeCartResponse(), items: [], subtotal: 0, itemCount: 0 } as any);
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getSummary — shipping ──────────────────────────────────────────────────

  describe('getSummary — shipping rate', () => {
    beforeEach(() => {
      cartService.getCart.mockResolvedValue(makeCartResponse() as any);
    });

    it('throws NotFoundException when shipping rate does not exist', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(null);
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when subtotal is below rate minimum', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(
        makeShippingRate({ minOrderAmt: 200 }),
      );
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns summary including shipping cost', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(makeShippingRate({ rate: 10, isFree: false }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = (await service.getSummary('user-1', { shippingRateId: 'rate-1' })) as any;
      expect(summary.shippingCost).toBe(10);
      expect(summary.total).toBeCloseTo(109.99, 2);
    });
  });

  // ── getSummary — coupon: PERCENTAGE ───────────────────────────────────────

  describe('getSummary — coupon PERCENTAGE', () => {
    beforeEach(() => {
      cartService.getCart.mockResolvedValue(makeCartResponse() as any); // subtotal = 99.99
      prisma.shippingRate.findUnique.mockResolvedValue(makeShippingRate({ rate: 0, isFree: false, minOrderAmt: 0 }));
    });

    it('throws BadRequestException for invalid coupon code', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'FAKE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for inactive coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ isActive: false }));
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for expired coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        makeCoupon({ expiresAt: new Date('2020-01-01') }),
      );
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when coupon not yet started', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        makeCoupon({ startsAt: new Date('2099-01-01') }),
      );
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when usage limit is reached', async () => {
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ usageLimit: 10, usedCount: 10 }));
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when per-user usage limit is reached', async () => {
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ usageLimitPerUser: 1 }));
      prisma.couponUsage.count.mockResolvedValue(1);
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when subtotal is below coupon minimum', async () => {
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ minOrderAmt: 200 }));
      await expect(
        service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calculates 20% discount: 99.99 × 0.20 = 19.998 → rounds to 20.00', async () => {
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ value: 20 }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = (await service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' })) as any;
      expect(summary.discount).toBeCloseTo(20, 1);
      expect(summary.total).toBeCloseTo(79.99, 1);
    });

    it('caps percentage discount at maxDiscount', async () => {
      // 20% of 99.99 = 19.998 but maxDiscount = 10 → discount = 10
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ value: 20, maxDiscount: 10 }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = (await service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE20' })) as any;
      expect(summary.discount).toBe(10);
      expect(summary.total).toBeCloseTo(89.99, 2);
    });
  });

  // ── getSummary — coupon: FIXED ────────────────────────────────────────────

  describe('getSummary — coupon FIXED', () => {
    beforeEach(() => {
      cartService.getCart.mockResolvedValue(makeCartResponse() as any); // subtotal = 99.99
      prisma.shippingRate.findUnique.mockResolvedValue(makeShippingRate({ rate: 0, isFree: false, minOrderAmt: 0 }));
    });

    it('applies fixed discount correctly', async () => {
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ type: CouponType.FIXED, value: 15 }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = (await service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'SAVE15' })) as any;
      expect(summary.discount).toBe(15);
      expect(summary.total).toBeCloseTo(84.99, 2);
    });

    it('caps fixed discount so total never goes negative', async () => {
      // Fixed ৳200 on a ৳99.99 cart → discount capped at 99.99
      prisma.coupon.findUnique.mockResolvedValue(makeCoupon({ type: CouponType.FIXED, value: 200 }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = (await service.getSummary('user-1', { shippingRateId: 'rate-1', couponCode: 'BIG' })) as any;
      expect(summary.discount).toBeCloseTo(99.99, 2);
      expect(summary.total).toBeGreaterThanOrEqual(0);
    });
  });
});
