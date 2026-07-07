import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { PaymentGateway, InitiatePaymentParams, InitiatePaymentResult, VerifyWebhookResult } from './payment-gateway.interface';

@Injectable()
export class StripeGateway implements PaymentGateway {
  private readonly logger = new Logger(StripeGateway.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY', 'sk_test_placeholder');
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    this.stripe = new Stripe(secretKey, { apiVersion: '2026-06-24.dahlia' });
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // convert to smallest unit
      currency: params.currency.toLowerCase(),
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        tranId: params.tranId,
      },
    });

    return {
      gatewayTxnId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ?? undefined,
      sessionData: { paymentIntentId: paymentIntent.id },
    };
  }

  async verifyWebhook(payload: Record<string, unknown>, rawBody?: Buffer): Promise<VerifyWebhookResult> {
    let event: Stripe.Event;

    if (this.webhookSecret && rawBody) {
      const sig = (payload['stripe-signature'] as string) ?? '';
      event = this.stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
    } else {
      event = payload as unknown as Stripe.Event;
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const tranId = intent.metadata?.tranId ?? intent.id;
      return {
        tranId,
        status: 'PAID',
        amount: intent.amount / 100,
        gatewayTxnId: intent.id,
        gatewayResponse: intent as unknown as Record<string, unknown>,
      };
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const tranId = intent.metadata?.tranId ?? intent.id;
      return {
        tranId,
        status: 'FAILED',
        gatewayTxnId: intent.id,
        gatewayResponse: intent as unknown as Record<string, unknown>,
      };
    }

    this.logger.log(`Unhandled Stripe event: ${event.type}`);
    throw new Error(`Unhandled event: ${event.type}`);
  }
}
