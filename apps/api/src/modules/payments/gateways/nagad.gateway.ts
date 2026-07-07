import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import type { PaymentGateway, InitiatePaymentParams, InitiatePaymentResult, VerifyWebhookResult } from './payment-gateway.interface';

@Injectable()
export class NagadGateway implements PaymentGateway {
  private readonly logger = new Logger(NagadGateway.name);
  private readonly merchantId: string;
  private readonly merchantPrivateKey: string;
  private readonly isLive: boolean;

  // Nagad public key for sandbox
  private readonly NAGAD_SANDBOX_PG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiOPfxAGVsaTrSSRfBcDZ
OKFlUhEWWi5OEyVSvvXD1mAP9XjsaVuWSlU78OBk8XHmRXlOOYEZ1VuLr5IG5lc
aI6n8kD5E5bpPVfzW0XkPpVQ5vMJU4P6uBCj9i0h3x5TiR7c4PpM6Nm6N7nxJ8
xKvlcJ4Qz2DKl/h3R5kRJbH3e8F0W2Q5eXiY0c6/F4Q6n7VF8UBmQy/MdEAH2Z
yC/mKYm1eQ7e2d3dCzWy4E+wRJmKoKRU4bDLN1C4OA/Y8Z9q6PVFY8oLg3qJ
Q1wQNPVhYV0MQQNQVJ6G+nFa7IyK2RaGAQPqMa/7JD4gIr7hL4GkIDAQAB
-----END PUBLIC KEY-----`;

  constructor(config: ConfigService) {
    this.merchantId = config.get<string>('NAGAD_MERCHANT_ID', '683002007104225');
    this.merchantPrivateKey = config.get<string>('NAGAD_MERCHANT_PRIVATE_KEY', '');
    this.isLive = config.get<string>('NAGAD_IS_LIVE', 'false') === 'true';
  }

  private get baseUrl(): string {
    return this.isLive
      ? 'https://api.mynagad.com/api/dfs'
      : 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs';
  }

  private encryptWithPublicKey(data: string): string {
    const pubKey = this.isLive
      ? this.merchantPrivateKey // In live, use Nagad's actual public key
      : this.NAGAD_SANDBOX_PG_PUBLIC_KEY;
    try {
      const buffer = Buffer.from(data, 'utf8');
      const encrypted = crypto.publicEncrypt(
        { key: pubKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        buffer,
      );
      return encrypted.toString('base64');
    } catch {
      return Buffer.from(data).toString('base64');
    }
  }

  private signWithPrivateKey(data: string): string {
    if (!this.merchantPrivateKey || this.merchantPrivateKey.startsWith('your_')) {
      return Buffer.from(data).toString('base64');
    }
    try {
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      return sign.sign(this.merchantPrivateKey, 'base64');
    } catch {
      return Buffer.from(data).toString('base64');
    }
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const datetime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const orderId = params.tranId;

    const sensitiveData = JSON.stringify({
      merchantId: this.merchantId,
      datetime,
      orderId,
      challenge: crypto.randomUUID(),
    });

    const encryptedData = this.encryptWithPublicKey(sensitiveData);
    const signature = this.signWithPrivateKey(sensitiveData);

    try {
      const initRes = await axios.post(
        `${this.baseUrl}/check-out/initialize/${this.merchantId}/${orderId}`,
        { dateTime: datetime, sensitiveData: encryptedData, signature },
        { headers: { 'Content-Type': 'application/json', 'X-KM-Api-Version': 'v-0.2.0' }, timeout: 15000 },
      );

      const { callBackUrl, tokenNumber } = initRes.data;

      const checkoutData = JSON.stringify({
        merchantId: this.merchantId,
        orderId,
        amount: params.amount.toFixed(2),
        currencyCode: '050',
        challenge: tokenNumber,
      });

      const encryptedCheckout = this.encryptWithPublicKey(checkoutData);
      const checkoutSignature = this.signWithPrivateKey(checkoutData);

      const completeRes = await axios.post(
        `${this.baseUrl}/check-out/complete/${this.merchantId}/${orderId}`,
        { sensitiveData: encryptedCheckout, signature: checkoutSignature, merchantCallbackURL: params.successUrl },
        { headers: { 'Content-Type': 'application/json', 'X-KM-Api-Version': 'v-0.2.0' }, timeout: 15000 },
      );

      return {
        gatewayTxnId: orderId,
        redirectUrl: completeRes.data.callBackUrl ?? callBackUrl,
        sessionData: { orderId, tokenNumber, callBackUrl },
      };
    } catch (err: any) {
      this.logger.error('Nagad initiate error', err?.response?.data ?? err.message);
      throw new Error('Nagad payment initiation failed. Please try another payment method.');
    }
  }

  async verifyWebhook(payload: Record<string, unknown>): Promise<VerifyWebhookResult> {
    const orderId = (payload['order_id'] ?? payload['orderId']) as string;
    const status = (payload['status'] ?? payload['paymentRefId']) as string;

    if (!orderId) {
      return { tranId: '', status: 'FAILED', gatewayResponse: payload };
    }

    try {
      const { data } = await axios.get(
        `${this.baseUrl}/verify/payment/${payload['payment_ref_id'] ?? status}`,
        { headers: { 'X-KM-Api-Version': 'v-0.2.0' }, timeout: 10000 },
      );

      if (data.status === 'Success') {
        return { tranId: orderId, status: 'PAID', gatewayTxnId: data.issuerPaymentRefNo, gatewayResponse: data };
      }
      return { tranId: orderId, status: 'FAILED', gatewayResponse: data };
    } catch (err) {
      this.logger.error('Nagad verify error', err);
      return { tranId: orderId, status: 'FAILED', gatewayResponse: payload };
    }
  }
}
