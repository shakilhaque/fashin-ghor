import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGatewayFactory } from './gateways/payment-gateway.factory';
import { PaymentsRepository } from './payments.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly repo: PaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly factory: PaymentGatewayFactory,
    private readonly config: ConfigService,
  ) {}

  private get webUrl(): string {
    return this.config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  private get apiUrl(): string {
    return this.config.get<string>('APP_URL', 'http://localhost:4000');
  }

  async initiatePayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, address: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Order does not belong to you');

    // COD orders don't need payment initiation
    if (order.paymentMethod === PaymentMethod.COD) {
      const existing = await this.repo.findByOrderId(orderId);
      if (!existing) {
        await this.repo.create({
          orderId,
          method: PaymentMethod.COD,
          amount: order.total,
          gatewayTxnId: `cod-${orderId}`,
          gatewayResponse: { method: 'COD' },
        });
      }
      return { method: 'COD', status: 'PENDING', message: 'Cash on Delivery — pay upon receipt' };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order has already been paid');
    }

    // Cancel any existing pending payment and create a fresh one
    const tranId = uuidv4();
    const gateway = this.factory.getGateway(order.paymentMethod);

    const apiBase = `${this.apiUrl}/api/v1`;
    const result = await gateway.initiate({
      tranId,
      orderId,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: 'BDT',
      customerName: order.user.name,
      customerEmail: order.user.email,
      customerPhone: order.user.phone ?? order.address?.phone ?? '',
      successUrl: `${apiBase}/payments/callback/${order.paymentMethod.toLowerCase()}/success?orderId=${orderId}`,
      failUrl: `${apiBase}/payments/callback/${order.paymentMethod.toLowerCase()}/fail?orderId=${orderId}`,
      cancelUrl: `${apiBase}/payments/callback/${order.paymentMethod.toLowerCase()}/cancel?orderId=${orderId}`,
    });

    await this.repo.create({
      orderId,
      method: order.paymentMethod,
      amount: order.total,
      gatewayTxnId: result.gatewayTxnId,
      gatewayResponse: result.sessionData ?? {},
    });

    return {
      method: order.paymentMethod,
      status: 'PENDING',
      redirectUrl: result.redirectUrl,
      clientSecret: result.clientSecret,
      gatewayTxnId: result.gatewayTxnId,
    };
  }

  async getPaymentByOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    return this.repo.findByOrderId(orderId);
  }

  async handleSslCommerzIpn(payload: Record<string, unknown>) {
    return this.processWebhook('SSLCOMMERZ', payload);
  }

  async handleBkashCallback(payload: Record<string, unknown>) {
    return this.processWebhook('BKASH', payload);
  }

  async handleNagadCallback(payload: Record<string, unknown>) {
    return this.processWebhook('NAGAD', payload);
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    return this.processWebhook('STRIPE', { 'stripe-signature': signature }, rawBody);
  }

  private async processWebhook(method: string, payload: Record<string, unknown>, rawBody?: Buffer) {
    try {
      const pm = method as PaymentMethod;
      const gateway = this.factory.getGateway(pm);
      const result = await gateway.verifyWebhook(payload, rawBody);

      const payment = await this.repo.findByGatewayTxnId(result.tranId);
      if (!payment) {
        this.logger.warn(`No payment found for tranId: ${result.tranId}`);
        return { received: true };
      }

      if (result.status === 'PAID') {
        await this.repo.markPaid(payment.id, result.gatewayTxnId, result.gatewayResponse);
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.PAID },
        });
        this.logger.log(`Payment confirmed for order ${payment.orderId}`);
      } else {
        await this.repo.markFailed(payment.id, result.gatewayResponse);
        this.logger.log(`Payment failed for order ${payment.orderId}`);
      }

      return { received: true, status: result.status };
    } catch (err: any) {
      this.logger.error(`${method} webhook error`, err.message);
      return { received: true, error: err.message };
    }
  }

  // Redirect handlers — SSLCommerz posts form data to our API, we redirect to frontend
  async handleGatewayRedirect(method: string, outcome: 'success' | 'fail' | 'cancel', orderId: string, body: Record<string, unknown>) {
    // Process the payment result if it's a success/fail post
    if (outcome === 'success' && Object.keys(body).length > 0) {
      await this.processWebhook(method.toUpperCase() as string, body);
    }

    const webUrl = this.webUrl;
    const statusMap = { success: 'success', fail: 'failed', cancel: 'cancelled' };
    return `${webUrl}/payment/${orderId}?status=${statusMap[outcome]}`;
  }

  // Dev-only: simulate payment success
  async simulatePayment(orderId: string, userId: string) {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new BadRequestException('Simulation not available in production');
    }

    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');

    let payment = await this.repo.findByOrderId(orderId);
    if (!payment) {
      payment = await this.repo.create({
        orderId,
        method: order.paymentMethod,
        amount: order.total,
        gatewayTxnId: `sim-${uuidv4()}`,
        gatewayResponse: { simulated: true },
      });
    }

    await this.repo.markPaid(payment.id, `sim-confirmed-${uuidv4()}`, { simulated: true, confirmedAt: new Date() });
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.PAID },
    });

    return { status: 'PAID', message: 'Payment simulated successfully' };
  }
}
