import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { PaymentGateway, InitiatePaymentParams, InitiatePaymentResult, VerifyWebhookResult } from './payment-gateway.interface';

@Injectable()
export class BkashGateway implements PaymentGateway {
  private readonly logger = new Logger(BkashGateway.name);
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly isLive: boolean;

  constructor(config: ConfigService) {
    this.appKey = config.get<string>('BKASH_APP_KEY', '');
    this.appSecret = config.get<string>('BKASH_APP_SECRET', '');
    this.username = config.get<string>('BKASH_USERNAME', '');
    this.password = config.get<string>('BKASH_PASSWORD', '');
    this.isLive = config.get<string>('BKASH_IS_LIVE', 'false') === 'true';
  }

  private get baseUrl(): string {
    return this.isLive
      ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
      : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
  }

  private async grantToken(): Promise<string> {
    const { data } = await axios.post(
      `${this.baseUrl}/tokenized/checkout/token/grant`,
      { app_key: this.appKey, app_secret: this.appSecret },
      {
        headers: {
          username: this.username,
          password: this.password,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );
    if (data.statusCode !== '0000') throw new Error(`bKash token grant failed: ${data.statusMessage}`);
    return data.id_token;
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const token = await this.grantToken();

    const { data } = await axios.post(
      `${this.baseUrl}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: params.customerPhone || params.customerEmail,
        callbackURL: params.successUrl,
        amount: params.amount.toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: params.tranId,
      },
      {
        headers: {
          Authorization: token,
          'X-APP-Key': this.appKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    if (data.statusCode !== '0000') {
      throw new Error(`bKash create payment failed: ${data.statusMessage}`);
    }

    return {
      gatewayTxnId: data.paymentID,
      redirectUrl: data.bkashURL,
      sessionData: { paymentID: data.paymentID, bkashURL: data.bkashURL, token },
    };
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<VerifyWebhookResult> {
    const paymentId = payload['paymentID'] as string;
    const status = payload['status'] as string;

    if (status === 'cancel' || status === 'failure') {
      return { tranId: paymentId, status: 'FAILED', gatewayResponse: payload };
    }

    // Execute the payment to confirm
    try {
      const token = await this.grantToken();
      const { data } = await axios.post(
        `${this.baseUrl}/tokenized/checkout/execute`,
        { paymentID: paymentId },
        {
          headers: {
            Authorization: token,
            'X-APP-Key': this.appKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      if (data.statusCode !== '0000' || data.transactionStatus !== 'Completed') {
        return { tranId: paymentId, status: 'FAILED', gatewayResponse: data };
      }

      return {
        tranId: paymentId,
        status: 'PAID',
        amount: Number(data.amount),
        gatewayTxnId: data.trxID,
        gatewayResponse: data,
      };
    } catch (err) {
      this.logger.error('bKash execute error', err);
      return { tranId: paymentId, status: 'FAILED', gatewayResponse: payload };
    }
  }
}
