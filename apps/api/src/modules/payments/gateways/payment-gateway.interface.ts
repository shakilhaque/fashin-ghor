export interface InitiatePaymentParams {
  tranId: string;       // our generated transaction ID
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
}

export interface InitiatePaymentResult {
  gatewayTxnId: string;
  redirectUrl?: string;      // SSLCommerz, bKash, Nagad
  clientSecret?: string;     // Stripe
  bkashURL?: string;
  sessionData?: Record<string, unknown>;
}

export interface VerifyWebhookResult {
  tranId: string;            // maps back to our Payment.gatewayTxnId
  status: 'PAID' | 'FAILED';
  amount?: number;
  gatewayTxnId?: string;    // final gateway transaction ID (may differ from initiation ID)
  gatewayResponse: Record<string, unknown>;
}

export interface PaymentGateway {
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verifyWebhook(payload: Record<string, unknown>, rawBody?: Buffer): Promise<VerifyWebhookResult>;
}
