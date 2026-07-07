export interface DispatchOrderParams {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;   // our internal tracking number (from Order.trackingNumber)
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  totalAmount: number;
  codAmount: number;        // 0 for prepaid
  weight?: number;          // kg
  notes?: string;
}

export interface DispatchOrderResult {
  courierOrderId: string;
  trackingNumber: string;   // courier's tracking number (may differ from ours)
  estimatedDelivery?: Date;
  label?: string;           // URL or base64 PDF label
}

export interface TrackingEvent {
  status: string;
  location?: string;
  description?: string;
  occurredAt: Date;
}

export interface TrackingResult {
  trackingNumber: string;
  currentStatus: string;
  events: TrackingEvent[];
  estimatedDelivery?: Date;
  deliveredAt?: Date;
}

export interface CourierGateway {
  createOrder(params: DispatchOrderParams): Promise<DispatchOrderResult>;
  trackOrder(trackingNumber: string): Promise<TrackingResult>;
}
