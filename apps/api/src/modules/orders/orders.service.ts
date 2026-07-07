import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrdersRepository } from './orders.repository';
import { NotificationsService } from '../notifications/notifications.service';

// Valid forward transitions for the order lifecycle
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
};

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.CONFIRMED]: 'Your order has been confirmed and is being prepared.',
  [OrderStatus.PACKED]: 'Your order has been packed and is ready for shipment.',
  [OrderStatus.SHIPPED]: 'Great news! Your order is on its way.',
  [OrderStatus.DELIVERED]: 'Your order has been delivered. Enjoy your purchase!',
  [OrderStatus.CANCELLED]: 'Your order has been cancelled.',
  [OrderStatus.RETURNED]: 'Your return request has been received.',
  [OrderStatus.REFUNDED]: 'Your refund has been processed.',
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listOrders(dto: ListOrdersDto) {
    return this.repo.findMany(dto);
  }

  async getStats() {
    return this.repo.getStats();
  }

  async getOrder(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getCustomerOrder(id: string, userId: string) {
    const order = await this.repo.findByIdAndUser(id, userId);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getCustomerOrders(userId: string, page: number, limit: number) {
    return this.repo.findByUser(userId, page, limit);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${dto.status}. Allowed: ${allowed?.join(', ') ?? 'none (terminal status)'}`,
      );
    }

    const updated = await this.repo.updateStatus(id, dto.status, dto.notes);

    const msg = STATUS_MESSAGES[dto.status];
    if (msg) {
      const user = order.user as { id: string; email: string; phone?: string | null };
      this.notificationsService
        .sendMulti({
          userId: user.id,
          title: `Order ${dto.status.charAt(0) + dto.status.slice(1).toLowerCase()}`,
          body: `${msg} (Order: ${order.orderNumber})`,
          actionUrl: `/orders/${order.id}`,
          email: user.email,
          phone: user.phone ?? undefined,
        })
        .catch(() => {});
    }

    return updated;
  }

  async updateTracking(id: string, dto: UpdateTrackingDto) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return this.repo.updateTracking(id, dto.trackingNumber, dto.notes);
  }

  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return this.repo.updatePaymentStatus(id, dto.paymentStatus);
  }
}
