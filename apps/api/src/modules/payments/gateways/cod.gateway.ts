import { Injectable } from '@nestjs/common';
import type { PaymentGateway, InitiatePaymentParams, InitiatePaymentResult, VerifyWebhookResult } from './payment-gateway.interface';

@Injectable()
export class CodGateway implements PaymentGateway {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    // COD requires no gateway — payment is confirmed on delivery
    return {
      gatewayTxnId: params.tranId,
      sessionData: { method: 'COD', note: 'Cash on Delivery — payment on delivery' },
    };
  }

  async verifyWebhook(_payload: Record<string, unknown>): Promise<VerifyWebhookResult> {
    // COD orders are never verified via webhook
    throw new Error('COD orders do not have webhook verification');
  }
}
