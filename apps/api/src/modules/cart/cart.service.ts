import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartRepository, CartWithItems } from './cart.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(
    private readonly repo: CartRepository,
    private readonly prisma: PrismaService,
  ) {}

  private buildCartResponse(cart: CartWithItems) {
    const items = cart.items.map((item) => {
      const unitPrice = item.variant?.price ?? item.product.price;
      const imageUrl = item.variant?.imageUrl ?? item.product.images[0]?.url ?? null;
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          imageUrl,
          price: item.product.price,
          stock: item.product.stock,
        },
        variant: item.variant
          ? {
              id: item.variant.id,
              sku: item.variant.sku,
              color: item.variant.color,
              size: item.variant.size,
              stock: item.variant.stock,
            }
          : null,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      id: cart.id,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: Math.round(subtotal * 100) / 100,
      couponCode: null,
    };
  }

  private async resolveCart(userId?: string, sessionId?: string) {
    if (userId) {
      let cart = await this.repo.findByUserId(userId);
      if (!cart) cart = await this.repo.createForUser(userId);
      return cart;
    }
    if (sessionId) {
      let cart = await this.repo.findBySessionId(sessionId);
      if (!cart) cart = await this.repo.createForSession(sessionId);
      return cart;
    }
    return null;
  }

  async getCart(userId?: string, sessionId?: string) {
    const cart = await this.resolveCart(userId, sessionId);
    if (!cart) return { id: null, items: [], subtotal: 0, itemCount: 0, discount: 0, shipping: 0, tax: 0, total: 0, couponCode: null };
    return this.buildCartResponse(cart);
  }

  async addItem(dto: AddToCartDto, userId?: string, sessionId?: string) {
    const cart = await this.resolveCart(userId, sessionId);
    if (!cart) throw new BadRequestException('Unable to identify cart — provide authentication or a session ID');

    // Validate product and stock
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    const qty = dto.quantity ?? 1;

    if (dto.variantId) {
      const variant = product.variants.find((v) => v.id === dto.variantId);
      if (!variant) throw new NotFoundException('Product variant not found');
      if (!variant.isActive) throw new BadRequestException('Variant is not available');
      if (variant.stock < qty) throw new BadRequestException(`Only ${variant.stock} unit(s) in stock`);
    } else {
      if (product.variants.length > 0) throw new BadRequestException('This product requires a variant selection');
      if (product.stock < qty) throw new BadRequestException(`Only ${product.stock} unit(s) in stock`);
    }

    await this.repo.upsertItem(cart.id, dto.productId, dto.variantId ?? null, qty);
    const updated = await this.repo.getCart(cart.id);
    return this.buildCartResponse(updated!);
  }

  async updateItem(itemId: string, dto: UpdateCartItemDto, userId?: string, sessionId?: string) {
    const cart = await this.resolveCart(userId, sessionId);
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.repo.findItemById(itemId);
    if (!item || item.cartId !== cart.id) throw new NotFoundException('Cart item not found');

    // Stock check
    if (item.variantId) {
      const variant = await this.prisma.productVariant.findUnique({ where: { id: item.variantId } });
      if (variant && variant.stock < dto.quantity) throw new BadRequestException(`Only ${variant.stock} unit(s) in stock`);
    } else {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (product && product.stock < dto.quantity) throw new BadRequestException(`Only ${product.stock} unit(s) in stock`);
    }

    await this.repo.updateItemQuantity(itemId, dto.quantity);
    const updated = await this.repo.getCart(cart.id);
    return this.buildCartResponse(updated!);
  }

  async removeItem(itemId: string, userId?: string, sessionId?: string) {
    const cart = await this.resolveCart(userId, sessionId);
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.repo.findItemById(itemId);
    if (!item || item.cartId !== cart.id) throw new NotFoundException('Cart item not found');

    await this.repo.deleteItem(itemId);
    const updated = await this.repo.getCart(cart.id);
    return this.buildCartResponse(updated!);
  }

  async clearCart(userId?: string, sessionId?: string) {
    const cart = await this.resolveCart(userId, sessionId);
    if (!cart) return;
    await this.repo.clearCart(cart.id);
  }

  async mergeGuestCart(userId: string, sessionId: string) {
    const guestCart = await this.repo.findBySessionId(sessionId);
    if (!guestCart || guestCart.items.length === 0) return this.getCart(userId);

    let userCart = await this.repo.findByUserId(userId);
    if (!userCart) userCart = await this.repo.createForUser(userId);

    await this.repo.mergeCarts(guestCart.id, userCart.id);

    const updated = await this.repo.getCart(userCart.id);
    return this.buildCartResponse(updated!);
  }
}
