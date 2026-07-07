import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { PaymentGateway, InitiatePaymentParams, InitiatePaymentResult, VerifyWebhookResult } from './payment-gateway.interface';

@Injectable()
export class SslCommerzGateway implements PaymentGateway {
  private readonly logger = new Logger(SslCommerzGateway.name);
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly isLive: boolean;

  constructor(config: ConfigService) {
    this.storeId = config.get<string>('SSLCOMMERZ_STORE_ID', 'testbox');
    this.storePassword = config.get<string>('SSLCOMMERZ_STORE_PASSWORD', 'qwerty');
    this.isLive = config.get<string>('SSLCOMMERZ_IS_LIVE', 'false') === 'true';
  }

  private get baseUrl(): string {
    return this.isLive
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const payload = new URLSearchParams({
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: params.amount.toFixed(2),
      currency: params.currency,
      tran_id: params.tranId,
      success_url: params.successUrl,
      fail_url: params.failUrl,
      cancel_url: params.cancelUrl,
      cus_name: params.customerName,
      cus_email: params.customerEmail,
      cus_phone: params.customerPhone,
      cus_add1: 'N/A',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: `Order ${params.orderNumber}`,
      product_category: 'Fashion',
      product_profile: 'general',
    });

    const { data } = await axios.post(`${this.baseUrl}/gwprocess/v4/api.php`, payload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    if (data.status !== 'SUCCESS') {
      this.logger.error('SSLCommerz init failed', data);
      throw new Error(data.failedreason ?? 'SSLCommerz initiation failed');
    }

    return {
      gatewayTxnId: params.tranId,
      redirectUrl: data.GatewayPageURL,
      sessionData: { sessionkey: data.sessionkey, GatewayPageURL: data.GatewayPageURL },
    };
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<VerifyWebhookResult> {
    const valId = payload['val_id'] as string;
    const tranId = payload['tran_id'] as string;
    const status = payload['status'] as string;
    const amount = Number(payload['amount']);

    if (status !== 'VALID' && status !== 'VALIDATED') {
      return {
        tranId,
        status: 'FAILED',
        gatewayResponse: payload,
      };
    }

    // Validate with SSLCommerz
    try {
      const { data } = await axios.get(`${this.baseUrl}/validator/api/validationserverAPI.php`, {
        params: { val_id: valId, store_id: this.storeId, store_passwd: this.storePassword },
        timeout: 10000,
      });

      if (data.status !== 'VALID' && data.status !== 'VALIDATED') {
        return { tranId, status: 'FAILED', gatewayResponse: data };
      }

      return {
        tranId,
        status: 'PAID',
        amount,
        gatewayTxnId: valId,
        gatewayResponse: data,
      };
    } catch (err) {
      this.logger.error('SSLCommerz validation error', err);
      return { tranId, status: 'FAILED', gatewayResponse: payload };
    }
  }
}
