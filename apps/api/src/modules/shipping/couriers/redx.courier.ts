import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { CourierGateway, DispatchOrderParams, DispatchOrderResult, TrackingResult } from './courier-gateway.interface';

@Injectable()
export class RedxCourier implements CourierGateway {
  private readonly logger = new Logger(RedxCourier.name);
  private readonly apiKey: string;
  private readonly isLive: boolean;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('REDX_API_KEY', '');
    this.isLive = config.get<string>('REDX_IS_LIVE', 'false') === 'true';
  }

  private get baseUrl(): string {
    return this.isLive ? 'https://openapi.redx.com.bd/v1.0.0-beta' : 'https://sandbox.redx.com.bd/v1.0.0-beta';
  }

  private get headers() {
    return { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' };
  }

  async createOrder(params: DispatchOrderParams): Promise<DispatchOrderResult> {
    const { data } = await axios.post(
      `${this.baseUrl}/parcel`,
      {
        name: params.recipientName,
        phone: params.recipientPhone,
        address: params.recipientAddress,
        merchant_invoice_id: params.orderNumber,
        cash_collection_amount: params.codAmount,
        parcel_weight: Math.round((params.weight ?? 0.5) * 1000), // grams
        instruction: params.notes ?? '',
        value: params.totalAmount,
      },
      { headers: this.headers },
    );
    return {
      courierOrderId: String(data.parcel?.parcel_id ?? ''),
      trackingNumber: data.parcel?.tracking_id ?? params.trackingNumber,
    };
  }

  async trackOrder(trackingNumber: string): Promise<TrackingResult> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/parcel/track/${trackingNumber}`, {
        headers: this.headers,
      });
      const events = (data.tracking ?? []).map((e: any) => ({
        status: e.status ?? '',
        location: e.hub ?? '',
        description: e.log ?? '',
        occurredAt: new Date(e.time),
      }));
      return { trackingNumber, currentStatus: data.status ?? 'UNKNOWN', events };
    } catch (err) {
      this.logger.error('RedX track error', err);
      return { trackingNumber, currentStatus: 'UNKNOWN', events: [] };
    }
  }
}
