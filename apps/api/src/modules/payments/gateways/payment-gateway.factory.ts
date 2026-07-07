import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import type { PaymentGateway } from './payment-gateway.interface';
import { CodGateway } from './cod.gateway';
import { SslCommerzGateway } from './sslcommerz.gateway';
import { BkashGateway } from './bkash.gateway';
import { NagadGateway } from './nagad.gateway';
import { StripeGateway } from './stripe.gateway';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly codGateway: CodGateway,
    private readonly sslCommerzGateway: SslCommerzGateway,
    private readonly bkashGateway: BkashGateway,
    private readonly nagadGateway: NagadGateway,
    private readonly stripeGateway: StripeGateway,
  ) {}

  getGateway(method: PaymentMethod): PaymentGateway {
    switch (method) {
      case PaymentMethod.COD:
        return this.codGateway;
      case PaymentMethod.SSLCOMMERZ:
        return this.sslCommerzGateway;
      case PaymentMethod.BKASH:
        return this.bkashGateway;
      case PaymentMethod.NAGAD:
        return this.nagadGateway;
      case PaymentMethod.STRIPE:
        return this.stripeGateway;
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }
}
