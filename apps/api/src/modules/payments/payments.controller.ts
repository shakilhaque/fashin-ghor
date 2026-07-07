import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Redirect,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // ── Authenticated ──────────────────────────────────────────────────────────

  @Post('initiate')
  async initiate(@Body() dto: InitiatePaymentDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.initiatePayment(dto.orderId, user.id);
    return { message: 'Payment initiated', data: { payment: result } };
  }

  @Get('order/:orderId')
  async getPayment(@Param('orderId') orderId: string, @CurrentUser() user: AuthenticatedUser) {
    const payment = await this.service.getPaymentByOrder(orderId, user.id);
    return { message: 'Payment retrieved', data: { payment } };
  }

  @Post('simulate/:orderId')
  async simulate(@Param('orderId') orderId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.simulatePayment(orderId, user.id);
    return { message: result.message, data: { result } };
  }

  // ── Webhooks (public) ──────────────────────────────────────────────────────

  @Public()
  @Post('webhook/sslcommerz')
  async sslCommerzIpn(@Body() body: Record<string, unknown>) {
    const result = await this.service.handleSslCommerzIpn(body);
    return result;
  }

  @Public()
  @Post('webhook/bkash')
  async bkashWebhook(@Body() body: Record<string, unknown>) {
    const result = await this.service.handleBkashCallback(body);
    return result;
  }

  @Public()
  @Post('webhook/nagad')
  async nagadWebhook(@Body() body: Record<string, unknown>) {
    const result = await this.service.handleNagadCallback(body);
    return result;
  }

  @Public()
  @Post('webhook/stripe')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from('');
    const result = await this.service.handleStripeWebhook(rawBody, sig);
    return result;
  }

  // ── Gateway redirect callbacks ────────────────────────────────────────────
  // SSLCommerz, bKash, Nagad POST or GET back to these URLs after payment

  @Public()
  @Post('callback/:method/success')
  @Redirect()
  async callbackSuccessPost(
    @Param('method') method: string,
    @Query('orderId') orderId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const url = await this.service.handleGatewayRedirect(method, 'success', orderId, body);
    return { url, statusCode: 302 };
  }

  @Public()
  @Get('callback/:method/success')
  @Redirect()
  async callbackSuccessGet(
    @Param('method') method: string,
    @Query('orderId') orderId: string,
    @Query() query: Record<string, unknown>,
  ) {
    const url = await this.service.handleGatewayRedirect(method, 'success', orderId, query);
    return { url, statusCode: 302 };
  }

  @Public()
  @Post('callback/:method/fail')
  @Redirect()
  async callbackFailPost(
    @Param('method') method: string,
    @Query('orderId') orderId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const url = await this.service.handleGatewayRedirect(method, 'fail', orderId, body);
    return { url, statusCode: 302 };
  }

  @Public()
  @Get('callback/:method/fail')
  @Redirect()
  async callbackFailGet(
    @Param('method') method: string,
    @Query('orderId') orderId: string,
  ) {
    const url = await this.service.handleGatewayRedirect(method, 'fail', orderId, {});
    return { url, statusCode: 302 };
  }

  @Public()
  @Post('callback/:method/cancel')
  @Redirect()
  async callbackCancelPost(
    @Param('method') method: string,
    @Query('orderId') orderId: string,
  ) {
    const url = await this.service.handleGatewayRedirect(method, 'cancel', orderId, {});
    return { url, statusCode: 302 };
  }

  @Public()
  @Get('callback/:method/cancel')
  @Redirect()
  async callbackCancelGet(
    @Param('method') method: string,
    @Query('orderId') orderId: string,
  ) {
    const url = await this.service.handleGatewayRedirect(method, 'cancel', orderId, {});
    return { url, statusCode: 302 };
  }
}
