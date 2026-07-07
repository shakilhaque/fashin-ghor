import { Injectable } from '@nestjs/common';
import type { CourierGateway, DispatchOrderParams, DispatchOrderResult, TrackingResult } from './courier-gateway.interface';

/**
 * Manual/custom courier — no API integration. Admin enters tracking info directly.
 */
@Injectable()
export class CustomCourier implements CourierGateway {
  async createOrder(params: DispatchOrderParams): Promise<DispatchOrderResult> {
    return {
      courierOrderId: params.orderNumber,
      trackingNumber: params.trackingNumber,
    };
  }

  async trackOrder(trackingNumber: string): Promise<TrackingResult> {
    return {
      trackingNumber,
      currentStatus: 'UNKNOWN',
      events: [],
    };
  }
}
