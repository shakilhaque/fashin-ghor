import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { PrismaService } from '../../prisma/prisma.service';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    name: 'Classic Shirt',
    slug: 'classic-shirt',
    price: 49.99,
    stock: 10,
    isActive: true,
    images: [{ url: 'https://cdn.test/img.jpg', altText: null }],
    variants: [],
    ...overrides,
  };
}

function makeVariant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'var-1',
    sku: 'SHIRT-BLK-M',
    color: 'Black',
    size: 'M',
    price: 54.99,
    stock: 5,
    imageUrl: null,
    isActive: true,
    ...overrides,
  };
}

function makeCartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'prod-1',
    variantId: null,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: makeProduct(),
    variant: null,
    ...overrides,
  };
}

function makeCart(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cart-1',
    userId: 'user-1',
    sessionId: null,
    couponId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CartService', () => {
  let service: CartService;
  let repo: jest.Mocked<CartRepository>;
  let prisma: {
    product: { findUnique: jest.Mock };
    productVariant: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: {
            findByUserId: jest.fn(),
            findBySessionId: jest.fn(),
            createForUser: jest.fn(),
            createForSession: jest.fn(),
            upsertItem: jest.fn(),
            updateItemQuantity: jest.fn(),
            deleteItem: jest.fn(),
            clearCart: jest.fn(),
            findItemById: jest.fn(),
            mergeCarts: jest.fn(),
            getCart: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            product: { findUnique: jest.fn() },
            productVariant: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    repo = module.get(CartRepository) as jest.Mocked<CartRepository>;
    prisma = module.get<PrismaService>(PrismaService) as unknown as typeof prisma;
  });

  // ── getCart ────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns empty response when called with no identity', async () => {
      const result = await service.getCart();
      expect(result.id).toBeNull();
      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
      expect(result.itemCount).toBe(0);
    });

    it('creates a new cart for user if none exists', async () => {
      const cart = makeCart({ items: [] });
      repo.findByUserId.mockResolvedValue(null);
      repo.createForUser.mockResolvedValue(cart as any);
      const result = await service.getCart('user-1');
      expect(repo.createForUser).toHaveBeenCalledWith('user-1');
      expect(result.id).toBe('cart-1');
    });

    it('calculates subtotal correctly from item prices and quantities', async () => {
      const item = makeCartItem({ quantity: 3 }); // 3 × 49.99 = 149.97
      const cart = makeCart({ items: [item] });
      repo.findByUserId.mockResolvedValue(cart as any);
      const result = await service.getCart('user-1');
      expect(result.subtotal).toBe(149.97);
      expect(result.itemCount).toBe(3);
    });

    it('uses variant price over base product price', async () => {
      const variant = makeVariant({ price: 59.99 });
      const item = makeCartItem({ variantId: 'var-1', variant, quantity: 2 }); // 2 × 59.99 = 119.98
      const cart = makeCart({ items: [item] });
      repo.findByUserId.mockResolvedValue(cart as any);
      const result = await service.getCart('user-1');
      expect(result.subtotal).toBe(119.98);
      expect(result.items[0].unitPrice).toBe(59.99);
    });

    it('uses product image when variant has no imageUrl', async () => {
      const item = makeCartItem({ variant: makeVariant({ imageUrl: null }) });
      const cart = makeCart({ items: [item] });
      repo.findByUserId.mockResolvedValue(cart as any);
      const result = await service.getCart('user-1');
      expect(result.items[0].product.imageUrl).toBe('https://cdn.test/img.jpg');
    });
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('throws BadRequestException when called with no identity', async () => {
      await expect(
        service.addItem({ productId: 'prod-1', quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when product does not exist', async () => {
      repo.findByUserId.mockResolvedValue(makeCart() as any);
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.addItem({ productId: 'prod-1', quantity: 1 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when product is inactive', async () => {
      repo.findByUserId.mockResolvedValue(makeCart() as any);
      prisma.product.findUnique.mockResolvedValue(makeProduct({ isActive: false }));
      await expect(
        service.addItem({ productId: 'prod-1', quantity: 1 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when variant required but not provided', async () => {
      repo.findByUserId.mockResolvedValue(makeCart() as any);
      prisma.product.findUnique.mockResolvedValue(
        makeProduct({ variants: [makeVariant()] }),
      );
      await expect(
        service.addItem({ productId: 'prod-1', quantity: 1 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when product stock is insufficient', async () => {
      repo.findByUserId.mockResolvedValue(makeCart() as any);
      prisma.product.findUnique.mockResolvedValue(makeProduct({ stock: 2, variants: [] }));
      await expect(
        service.addItem({ productId: 'prod-1', quantity: 5 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when variant id does not match product', async () => {
      repo.findByUserId.mockResolvedValue(makeCart() as any);
      prisma.product.findUnique.mockResolvedValue(makeProduct({ variants: [makeVariant({ id: 'var-other' })] }));
      await expect(
        service.addItem({ productId: 'prod-1', variantId: 'var-1', quantity: 1 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when variant stock is insufficient', async () => {
      repo.findByUserId.mockResolvedValue(makeCart() as any);
      prisma.product.findUnique.mockResolvedValue(makeProduct({ variants: [makeVariant({ id: 'var-1', stock: 1 })] }));
      await expect(
        service.addItem({ productId: 'prod-1', variantId: 'var-1', quantity: 3 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('upserts item and returns updated cart on success', async () => {
      const cart = makeCart({ items: [] });
      const updatedCart = makeCart({ items: [makeCartItem()] });
      repo.findByUserId.mockResolvedValue(cart as any);
      prisma.product.findUnique.mockResolvedValue(makeProduct({ stock: 10, variants: [] }));
      repo.upsertItem.mockResolvedValue(undefined as any);
      repo.getCart.mockResolvedValue(updatedCart as any);
      const result = await service.addItem({ productId: 'prod-1', quantity: 1 }, 'user-1');
      expect(repo.upsertItem).toHaveBeenCalledWith('cart-1', 'prod-1', null, 1);
      expect(result.items).toHaveLength(1);
    });
  });

  // ── updateItem ─────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('throws NotFoundException when item belongs to a different cart', async () => {
      repo.findByUserId.mockResolvedValue(makeCart({ id: 'cart-1' }) as any);
      repo.findItemById.mockResolvedValue(makeCartItem({ cartId: 'cart-other' }) as any);
      await expect(
        service.updateItem('item-1', { quantity: 2 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when new quantity exceeds stock', async () => {
      const cart = makeCart({ id: 'cart-1' });
      repo.findByUserId.mockResolvedValue(cart as any);
      repo.findItemById.mockResolvedValue(makeCartItem({ cartId: 'cart-1', variantId: null }) as any);
      prisma.product.findUnique.mockResolvedValue(makeProduct({ stock: 2 }));
      await expect(
        service.updateItem('item-1', { quantity: 5 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates quantity and returns refreshed cart', async () => {
      const cart = makeCart({ id: 'cart-1' });
      const updatedCart = makeCart({ items: [makeCartItem({ quantity: 3 })] });
      repo.findByUserId.mockResolvedValue(cart as any);
      repo.findItemById.mockResolvedValue(makeCartItem({ cartId: 'cart-1', variantId: null }) as any);
      prisma.product.findUnique.mockResolvedValue(makeProduct({ stock: 10 }));
      repo.updateItemQuantity.mockResolvedValue(undefined as any);
      repo.getCart.mockResolvedValue(updatedCart as any);
      const result = await service.updateItem('item-1', { quantity: 3 }, 'user-1');
      expect(repo.updateItemQuantity).toHaveBeenCalledWith('item-1', 3);
      expect(result.items[0].quantity).toBe(3);
    });
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('throws NotFoundException when item belongs to a different cart', async () => {
      repo.findByUserId.mockResolvedValue(makeCart({ id: 'cart-1' }) as any);
      repo.findItemById.mockResolvedValue(makeCartItem({ cartId: 'cart-other' }) as any);
      await expect(service.removeItem('item-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('deletes the item and returns updated cart', async () => {
      const cart = makeCart({ id: 'cart-1' });
      const emptyCart = makeCart({ items: [] });
      repo.findByUserId.mockResolvedValue(cart as any);
      repo.findItemById.mockResolvedValue(makeCartItem({ cartId: 'cart-1' }) as any);
      repo.deleteItem.mockResolvedValue(undefined as any);
      repo.getCart.mockResolvedValue(emptyCart as any);
      const result = await service.removeItem('item-1', 'user-1');
      expect(repo.deleteItem).toHaveBeenCalledWith('item-1');
      expect(result.items).toHaveLength(0);
    });
  });

  // ── mergeGuestCart ─────────────────────────────────────────────────────────

  describe('mergeGuestCart', () => {
    it('returns user cart immediately when guest cart is empty', async () => {
      repo.findBySessionId.mockResolvedValue(makeCart({ id: 'guest-cart', items: [] }) as any);
      repo.findByUserId.mockResolvedValue(makeCart({ id: 'cart-1', items: [] }) as any);
      await service.mergeGuestCart('user-1', 'sess-1');
      expect(repo.mergeCarts).not.toHaveBeenCalled();
    });

    it('returns user cart when no guest cart exists', async () => {
      repo.findBySessionId.mockResolvedValue(null);
      repo.findByUserId.mockResolvedValue(makeCart({ id: 'cart-1', items: [] }) as any);
      await service.mergeGuestCart('user-1', 'sess-1');
      expect(repo.mergeCarts).not.toHaveBeenCalled();
    });

    it('merges guest items into user cart', async () => {
      const guestCart = makeCart({ id: 'guest-cart', items: [makeCartItem()] });
      const userCart = makeCart({ id: 'cart-1', items: [] });
      const mergedCart = makeCart({ id: 'cart-1', items: [makeCartItem()] });
      repo.findBySessionId.mockResolvedValue(guestCart as any);
      repo.findByUserId.mockResolvedValue(userCart as any);
      repo.mergeCarts.mockResolvedValue(undefined as any);
      repo.getCart.mockResolvedValue(mergedCart as any);
      await service.mergeGuestCart('user-1', 'sess-1');
      expect(repo.mergeCarts).toHaveBeenCalledWith('guest-cart', 'cart-1');
    });
  });
});
