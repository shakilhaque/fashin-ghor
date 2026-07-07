import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrdersService } from './orders.service';

const ORDER_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT] as const;
const MGMT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Get()
  @Roles(...ORDER_ROLES)
  async listOrders(@Query() dto: ListOrdersDto) {
    const result = await this.service.listOrders(dto);
    return {
      message: 'Orders retrieved',
      data: { orders: result.orders },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get('stats')
  @Roles(...ORDER_ROLES)
  async getStats() {
    const stats = await this.service.getStats();
    return { message: 'Order stats retrieved', data: { stats } };
  }

  @Get(':id')
  @Roles(...ORDER_ROLES)
  async getOrder(@Param('id') id: string) {
    const order = await this.service.getOrder(id);
    return { message: 'Order retrieved', data: { order } };
  }

  @Patch(':id/status')
  @Roles(...MGMT_ROLES)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    const order = await this.service.updateStatus(id, dto);
    return { message: `Order status updated to ${dto.status}`, data: { order } };
  }

  @Patch(':id/tracking')
  @Roles(...ORDER_ROLES)
  async updateTracking(@Param('id') id: string, @Body() dto: UpdateTrackingDto) {
    const order = await this.service.updateTracking(id, dto);
    return { message: 'Tracking number updated', data: { order } };
  }

  @Patch(':id/payment-status')
  @Roles(...MGMT_ROLES)
  async updatePaymentStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    const order = await this.service.updatePaymentStatus(id, dto);
    return { message: `Payment status updated to ${dto.paymentStatus}`, data: { order } };
  }

  // ── Customer endpoints ─────────────────────────────────────────────────────

  @Get('my/list')
  async getMyOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.service.getCustomerOrders(user.id, Number(page), Number(limit));
    return {
      message: 'Your orders retrieved',
      data: { orders: result.orders },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get('my/:id')
  async getMyOrder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const order = await this.service.getCustomerOrder(id, user.id);
    return { message: 'Order retrieved', data: { order } };
  }
}
