import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CheckoutSummaryDto } from './dto/checkout-summary.dto';
import { PlaceOrderDto } from './dto/place-order.dto';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  @Post('summary')
  async summary(@Body() dto: CheckoutSummaryDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.getSummary(user.id, dto);
    return { message: 'Checkout summary', data: { summary: result } };
  }

  @Post('place-order')
  async placeOrder(@Body() dto: PlaceOrderDto, @CurrentUser() user: AuthenticatedUser) {
    const order = await this.service.placeOrder(user.id, dto);
    return { message: 'Order placed successfully', data: { order } };
  }

  @Get('orders')
  async getOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.service.getUserOrders(user.id, Number(page), Number(limit));
    return {
      message: 'Orders retrieved',
      data: { orders: result.orders },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const order = await this.service.getOrder(id, user.id);
    return { message: 'Order retrieved', data: { order } };
  }
}
