import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          isActive: true,
          images: { select: { url: true, altText: true }, orderBy: { position: 'asc' as const }, take: 1 },
        },
      },
      variant: {
        select: { id: true, sku: true, color: true, size: true, price: true, stock: true, imageUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  }

  findBySessionId(sessionId: string) {
    return this.prisma.cart.findUnique({ where: { sessionId }, include: cartInclude });
  }

  createForUser(userId: string) {
    return this.prisma.cart.create({ data: { userId }, include: cartInclude });
  }

  createForSession(sessionId: string) {
    return this.prisma.cart.create({ data: { sessionId }, include: cartInclude });
  }

  async upsertItem(cartId: string, productId: string, variantId: string | null, quantity: number) {
    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId, productId, variantId: variantId ?? undefined },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: { cartId, productId, variantId: variantId ?? undefined, quantity },
    });
  }

  updateItemQuantity(itemId: string, quantity: number) {
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  deleteItem(itemId: string) {
    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  findItemById(itemId: string) {
    return this.prisma.cartItem.findUnique({ where: { id: itemId } });
  }

  async mergeCarts(guestCartId: string, userCartId: string) {
    const guestItems = await this.prisma.cartItem.findMany({
      where: { cartId: guestCartId },
      include: { product: true, variant: true },
    });

    for (const guestItem of guestItems) {
      const existing = await this.prisma.cartItem.findFirst({
        where: { cartId: userCartId, productId: guestItem.productId, variantId: guestItem.variantId ?? undefined },
      });

      const maxStock = guestItem.variantId
        ? (guestItem.variant?.stock ?? 0)
        : (guestItem.product?.stock ?? 0);

      if (existing) {
        const newQty = Math.min(existing.quantity + guestItem.quantity, maxStock);
        await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
      } else {
        const qty = Math.min(guestItem.quantity, maxStock);
        if (qty > 0) {
          await this.prisma.cartItem.create({
            data: { cartId: userCartId, productId: guestItem.productId, variantId: guestItem.variantId ?? undefined, quantity: qty },
          });
        }
      }
    }

    await this.prisma.cart.delete({ where: { id: guestCartId } });
  }

  getCart(cartId: string) {
    return this.prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
  }
}
