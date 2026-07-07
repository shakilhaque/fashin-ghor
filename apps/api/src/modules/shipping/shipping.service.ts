import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CourierGatewayFactory } from './couriers/courier-gateway.factory';
import { ShippingRepository } from './shipping.repository';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateRateDto } from './dto/create-rate.dto';
import { DispatchShipmentDto } from './dto/dispatch-shipment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly repo: ShippingRepository,
    private readonly prisma: PrismaService,
    private readonly courierFactory: CourierGatewayFactory,
  ) {}

  // ── Public ───────────────────────────────────────────────────────────────

  async getPublicRates() {
    return this.repo.findPublicRates();
  }

  async trackByNumber(trackingNumber: string) {
    // 1. Look up our DB first
    const shipment = await this.repo.findShipmentByTracking(trackingNumber);
    if (!shipment) {
      throw new NotFoundException(`No shipment found for tracking number: ${trackingNumber}`);
    }

    // 2. Refresh from courier API if we have an integration
    try {
      const gateway = this.courierFactory.getGateway(shipment.courier);
      const liveTracking = await gateway.trackOrder(shipment.trackingNumber);

      if (liveTracking.events.length > 0) {
        await this.repo.updateShipmentEvents(shipment.id, liveTracking.events);
        // Auto-update shipment as delivered if courier says so
        if (liveTracking.deliveredAt && !shipment.deliveredAt) {
          await this.repo.updateShipmentDelivered(shipment.id);
        }
      }

      return {
        trackingNumber: shipment.trackingNumber,
        courier: shipment.courier,
        orderNumber: shipment.order?.orderNumber,
        currentStatus: liveTracking.currentStatus,
        estimatedDelivery: shipment.estimatedAt,
        deliveredAt: liveTracking.deliveredAt ?? shipment.deliveredAt,
        events: liveTracking.events.length > 0 ? liveTracking.events : shipment.events,
      };
    } catch {
      // Fall back to stored events on API failure
      const latestStatus = shipment.events[0]?.status ?? 'DISPATCHED';
      return {
        trackingNumber: shipment.trackingNumber,
        courier: shipment.courier,
        orderNumber: shipment.order?.orderNumber,
        currentStatus: latestStatus,
        estimatedDelivery: shipment.estimatedAt,
        deliveredAt: shipment.deliveredAt,
        events: shipment.events,
      };
    }
  }

  // ── Admin — Zones ────────────────────────────────────────────────────────

  async getZones() {
    return this.repo.findAllZones();
  }

  async getZone(id: string) {
    const zone = await this.repo.findZoneById(id);
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return zone;
  }

  async createZone(dto: CreateZoneDto) {
    return this.repo.createZone(dto);
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    await this.getZone(id); // 404 check
    return this.repo.updateZone(id, dto);
  }

  async deleteZone(id: string) {
    await this.getZone(id);
    try {
      await this.repo.deleteZone(id);
    } catch {
      throw new BadRequestException('Cannot delete zone with existing rates. Remove rates first.');
    }
  }

  // ── Admin — Rates ────────────────────────────────────────────────────────

  async addRate(zoneId: string, dto: CreateRateDto) {
    await this.getZone(zoneId);
    return this.repo.createRate(zoneId, dto);
  }

  async updateRate(id: string, dto: Partial<CreateRateDto>) {
    const rate = await this.prisma.shippingRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException('Shipping rate not found');
    return this.repo.updateRate(id, dto);
  }

  async deleteRate(id: string) {
    const rate = await this.prisma.shippingRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException('Shipping rate not found');
    return this.repo.deleteRate(id);
  }

  // ── Admin — Shipments ────────────────────────────────────────────────────

  async getShipments(page: number, limit: number) {
    return this.repo.findAllShipments(page, limit);
  }

  async getShipmentByOrder(orderId: string) {
    const shipment = await this.repo.findShipmentByOrder(orderId);
    if (!shipment) throw new NotFoundException('No shipment found for this order');
    return shipment;
  }

  async dispatchOrder(dto: DispatchShipmentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { user: true, address: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.repo.findShipmentByOrder(dto.orderId);
    if (existing) throw new BadRequestException('Order has already been dispatched');

    const trackingNumber = dto.trackingNumber ?? `LM-${uuidv4().substring(0, 8).toUpperCase()}`;
    const gateway = this.courierFactory.getGateway(dto.courier);

    let courierOrderId: string | undefined;
    let estimatedAt: Date | undefined;

    try {
      const result = await gateway.createOrder({
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingNumber,
        recipientName: order.address?.recipientName ?? order.user.name,
        recipientPhone: order.address?.phone ?? order.user.phone ?? '',
        recipientAddress: order.address?.addressLine1 ?? '',
        recipientCity: order.address?.city ?? 'Dhaka',
        totalAmount: order.total,
        codAmount: order.paymentMethod === 'COD' ? order.total : 0,
        weight: dto.weight,
        notes: dto.notes,
      });
      courierOrderId = result.courierOrderId;
      estimatedAt = result.estimatedDelivery;
      // Use courier's tracking number if provided
      if (result.trackingNumber && result.trackingNumber !== trackingNumber) {
        // keep our tracking number as canonical
      }
    } catch (err: any) {
      this.logger.warn(`Courier API failed for ${dto.courier}, using manual tracking: ${err.message}`);
    }

    // Create shipment record + update order
    const shipment = await this.repo.createShipment({
      orderId: dto.orderId,
      courier: dto.courier,
      trackingNumber,
      courierOrderId,
      estimatedAt,
      notes: dto.notes,
    });

    // Update order tracking number + status → SHIPPED
    await this.repo.updateOrderTracking(dto.orderId, trackingNumber);

    return shipment;
  }

  async refreshTracking(orderId: string) {
    const shipment = await this.repo.findShipmentByOrder(orderId);
    if (!shipment) throw new NotFoundException('No shipment found for this order');

    const gateway = this.courierFactory.getGateway(shipment.courier);
    const liveTracking = await gateway.trackOrder(shipment.trackingNumber);

    if (liveTracking.events.length > 0) {
      await this.repo.updateShipmentEvents(shipment.id, liveTracking.events);
    }

    return this.repo.findShipmentByOrder(orderId);
  }
}
