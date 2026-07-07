import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodGateway } from './gateways/cod.gateway';
import { SslCommerzGateway } from './gateways/sslcommerz.gateway';
import { BkashGateway } from './gateways/bkash.gateway';
import { NagadGateway } from './gateways/nagad.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { PaymentGatewayFactory } from './gateways/payment-gateway.factory';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    PaymentGatewayFactory,
    CodGateway,
    SslCommerzGateway,
    BkashGateway,
    NagadGateway,
    StripeGateway,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
