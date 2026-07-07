import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { CourierGateway, DispatchOrderParams, DispatchOrderResult, TrackingResult } from './courier-gateway.interface';

const BASE_URL = 'https://portal.steadfast.com.bd/public-api/v1';

@Injectable()
export class SteadfastCourier implements CourierGateway {
  private readonly logger = new Logger(SteadfastCourier.name);
  private readonly apiKey: string;
  private readonly secretKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('STEADFAST_API_KEY', '');
    this.secretKey = config.get<string>('STEADFAST_SECRET_KEY', '');
  }

  private get headers() {
    return { 'Api-Key': this.apiKey, 'Secret-Key': this.secretKey, 'Content-Type': 'application/json' };
  }

  async createOrder(params: DispatchOrderParams): Promise<DispatchOrderResult> {
    const { data } = await axios.post(
      `${BASE_URL}/create_order`,
      {
        invoice: params.orderNumber,
        recipient_name: params.recipientName,
        recipient_phone: params.recipientPhone,
        recipient_address: `${params.recipientAddress}, ${params.recipientCity}`,
        cod_amount: params.codAmount,
        note: params.notes ?? '',
      },
      { headers: this.headers },
    );
    return {
      courierOrderId: String(data.consignment?.id ?? ''),
      trackingNumber: data.consignment?.tracking_code ?? params.trackingNumber,
    };
  }

  async trackOrder(trackingNumber: string): Promise<TrackingResult> {
    try {
      const { data } = await axios.get(`${BASE_URL}/status/by-tracking-code/${trackingNumber}`, {
        headers: this.headers,
      });
      const statusMap: Record<string, string> = {
        pending: 'PENDING',
        in_review: 'IN_REVIEW',
        confirmed: 'CONFIRMED',
        processing: 'PROCESSING',
        picked_up: 'PICKED_UP',
        on_delivery: 'IN_TRANSIT',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED',
        hold: 'ON_HOLD',
        partial_delivered: 'PARTIAL_DELIVERED',
        returned: 'RETURNED',
      };
      const currentStatus = statusMap[data.delivery_status] ?? data.delivery_status ?? 'UNKNOWN';
      const events = data.tracking?.map((e: any) => ({
        status: statusMap[e.status] ?? e.status,
        description: e.details ?? '',
        occurredAt: new Date(e.time),
      })) ?? [];
      return { trackingNumber, currentStatus, events };
    } catch (err) {
      this.logger.error('Steadfast track error', err);
      return { trackingNumber, currentStatus: 'UNKNOWN', events: [] };
    }
  }
}
