import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { CourierGateway, DispatchOrderParams, DispatchOrderResult, TrackingResult } from './courier-gateway.interface';

@Injectable()
export class PathaoCourier implements CourierGateway {
  private readonly logger = new Logger(PathaoCourier.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isLive: boolean;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('PATHAO_CLIENT_ID', '');
    this.clientSecret = config.get<string>('PATHAO_CLIENT_SECRET', '');
    this.isLive = config.get<string>('PATHAO_IS_LIVE', 'false') === 'true';
  }

  private get baseUrl(): string {
    return this.isLive
      ? 'https://api-hermes.pathao.com'
      : 'https://hermes.p-stageapi.com';
  }

  private async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    const { data } = await axios.post(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
    });
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000 - 60000);
    return this.accessToken!;
  }

  async createOrder(params: DispatchOrderParams): Promise<DispatchOrderResult> {
    const token = await this.getToken();
    const { data } = await axios.post(
      `${this.baseUrl}/aladdin/api/v1/orders`,
      {
        store_id: this.clientId,
        merchant_order_id: params.orderNumber,
        recipient_name: params.recipientName,
        recipient_phone: params.recipientPhone,
        recipient_address: params.recipientAddress,
        recipient_city: 1, // Dhaka city ID
        delivery_type: 48, // 48h delivery
        item_type: 2,      // parcel
        special_instruction: params.notes ?? '',
        item_quantity: 1,
        item_weight: params.weight ?? 0.5,
        amount_to_collect: params.codAmount,
        item_description: `Order ${params.orderNumber}`,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return {
      courierOrderId: String(data.consignment_id),
      trackingNumber: data.consignment_id ? String(data.consignment_id) : params.trackingNumber,
    };
  }

  async trackOrder(trackingNumber: string): Promise<TrackingResult> {
    try {
      const token = await this.getToken();
      const { data } = await axios.get(
        `${this.baseUrl}/aladdin/api/v1/orders/${trackingNumber}/info`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const events = (data.tracking_events ?? []).map((e: any) => ({
        status: e.status,
        location: e.location,
        description: e.remark,
        occurredAt: new Date(e.created_at),
      }));
      return { trackingNumber, currentStatus: data.order_status ?? 'UNKNOWN', events };
    } catch (err) {
      this.logger.error('Pathao track error', err);
      return { trackingNumber, currentStatus: 'UNKNOWN', events: [] };
    }
  }
}
