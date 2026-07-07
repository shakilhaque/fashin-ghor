import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CheckoutSummaryDto } from './dto/checkout-summary.dto';
import { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveCart(userId: string) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) throw new BadRequestException('Your cart is empty');
    return cart;
  }

  private async resolveShippingRate(rateId: string, subtotal: number) {
    const rate = await this.prisma.shippingRate.findUnique({ where: { id: rateId } });
    if (!rate) throw new NotFoundException('Shipping rate not found');
    if (subtotal < rate.minOrderAmt) {
      throw new BadRequestException(
        `Order minimum ৳${rate.minOrderAmt} required for "${rate.name}". Current subtotal: ৳${subtotal}`,
      );
    }
    return rate;
  }

  private async resolveCoupon(code: string, subtotal: number, userId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid or inactive coupon code');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException('Coupon is not yet active');
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (subtotal < coupon.minOrderAmt) {
      throw new BadRequestException(`Minimum order of ৳${coupon.minOrderAmt} required for this coupon`);
    }

    // Per-user usage check
    if (coupon.usageLimitPerUser) {
      const userUsage = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsage >= coupon.usageLimitPerUser) {
        throw new BadRequestException('You have already used this coupon');
      }
    }

    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === CouponType.FIXED) {
      discount = Math.min(coupon.value, subtotal);
    }

    return { coupon, discount: Math.round(discount * 100) / 100 };
  }

  private calculateTax(_subtotal: number, _discount: number) {
    // Flat 0% VAT for now — real VAT per-product in Phase 10
    return 0;
  }

  async getSummary(userId: string, dto: CheckoutSummaryDto) {
    const cart = await this.resolveCart(userId);
    const shippingRate = await this.resolveShippingRate(dto.shippingRateId, cart.subtotal);

    let discount = 0;
    let appliedCoupon: string | null = null;
    if (dto.couponCode) {
      const result = await this.resolveCoupon(dto.couponCode, cart.subtotal, userId);
      discount = result.discount;
      appliedCoupon = result.coupon.code;
    }

    const shippingCost = shippingRate.isFree ? 0 : shippingRate.rate;
    const tax = this.calculateTax(cart.subtotal, discount);
    const total = Math.max(0, cart.subtotal - discount + shippingCost + tax);

    return {
      items: cart.items,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      shippingCost,
      shippingRateName: shippingRate.name,
      discount,
      couponCode: appliedCoupon,
      tax,
      total: Math.round(total * 100) / 100,
    };
  }

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    const cart = await this.resolveCart(userId);

    // Validate address belongs to user
    const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
    if (!address || address.userId !== userId) throw new UnauthorizedException('Address not found');

    const shippingRate = await this.resolveShippingRate(dto.shippingRateId, cart.subtotal);

    let discount = 0;
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;
    if (dto.couponCode) {
      const result = await this.resolveCoupon(dto.couponCode, cart.subtotal, userId);
      discount = result.discount;
      couponId = result.coupon.id;
      appliedCouponCode = result.coupon.code;
    }

    const shippingCost = shippingRate.isFree ? 0 : shippingRate.rate;
    const tax = this.calculateTax(cart.subtotal, discount);
    const total = Math.max(0, Math.round((cart.subtotal - discount + shippingCost + tax) * 100) / 100);
    const orderNumber = `LM-${Date.now()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          paymentMethod: dto.paymentMethod,
          subtotal: cart.subtotal,
          shippingCost,
          discount,
          tax,
          total,
          couponCode: appliedCouponCode,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              variantLabel: item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(' / ') : null,
              sku: item.variant?.sku ?? '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              imageUrl: item.product.imageUrl,
            })),
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      // Record initial status history
      await tx.orderStatusHistory.create({
        data: { orderId: newOrder.id, status: 'PENDING', notes: 'Order placed' },
      });

      // Coupon usage
      if (couponId) {
        await tx.couponUsage.create({
          data: { couponId, userId, orderId: newOrder.id },
        });
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Decrement stock
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        // Decrement inventory (best-effort: reduce from any available warehouse slot)
        const inv = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            quantity: { gte: item.quantity },
          },
          orderBy: { updatedAt: 'desc' },
        });
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cart: { userId } } });

      return newOrder;
    });

    // Fire order placed notification (non-blocking)
    this.prisma.user
      .findUnique({ where: { id: userId }, select: { email: true, phone: true } })
      .then((u) => {
        const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(order.total);
        return this.notificationsService.sendMulti({
          userId,
          title: 'Order Placed Successfully',
          body: `Your order ${order.orderNumber} for ${amount} has been placed and is being processed.`,
          actionUrl: `/orders/${order.id}`,
          email: u?.email,
          phone: u?.phone ?? undefined,
        });
      })
      .catch(() => {});

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      couponCode: order.couponCode,
      items: order.items,
      address: order.address,
      createdAt: order.createdAt,
    };
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found');
    return order;
  }

  async getUserOrders(userId: string, page = 1, limit = 10) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: { take: 3 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
