import { Injectable } from '@nestjs/common';
import { CourierProvider, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateRateDto } from './dto/create-rate.dto';

@Injectable()
export class ShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Zones ────────────────────────────────────────────────────────────────

  async findAllZones() {
    return this.prisma.shippingZone.findMany({
      include: { rates: { orderBy: { rate: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findZoneById(id: string) {
    return this.prisma.shippingZone.findUnique({
      where: { id },
      include: { rates: { orderBy: { rate: 'asc' } } },
    });
  }

  async createZone(dto: CreateZoneDto) {
    return this.prisma.shippingZone.create({
      data: {
        name: dto.name,
        countries: dto.countries,
        cities: dto.cities ?? [],
        isActive: dto.isActive ?? true,
      },
      include: { rates: true },
    });
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    return this.prisma.shippingZone.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.countries && { countries: dto.countries }),
        ...(dto.cities !== undefined && { cities: dto.cities }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { rates: { orderBy: { rate: 'asc' } } },
    });
  }

  async deleteZone(id: string) {
    return this.prisma.shippingZone.delete({ where: { id } });
  }

  // ── Rates ────────────────────────────────────────────────────────────────

  async findPublicRates() {
    return this.prisma.shippingRate.findMany({
      include: { zone: { select: { id: true, name: true, countries: true } } },
      orderBy: { rate: 'asc' },
    });
  }

  async createRate(zoneId: string, dto: CreateRateDto) {
    return this.prisma.shippingRate.create({
      data: {
        zoneId,
        name: dto.name,
        minWeight: dto.minWeight ?? 0,
        maxWeight: dto.maxWeight,
        minOrderAmt: dto.minOrderAmt ?? 0,
        rate: dto.rate,
        isFree: dto.isFree ?? false,
      },
      include: { zone: true },
    });
  }

  async updateRate(id: string, dto: Partial<CreateRateDto>) {
    return this.prisma.shippingRate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.minWeight !== undefined && { minWeight: dto.minWeight }),
        ...(dto.maxWeight !== undefined && { maxWeight: dto.maxWeight }),
        ...(dto.minOrderAmt !== undefined && { minOrderAmt: dto.minOrderAmt }),
        ...(dto.rate !== undefined && { rate: dto.rate }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree }),
      },
      include: { zone: true },
    });
  }

  async deleteRate(id: string) {
    return this.prisma.shippingRate.delete({ where: { id } });
  }

  // ── Shipments ────────────────────────────────────────────────────────────

  async findShipmentByOrder(orderId: string) {
    return this.prisma.shipment.findUnique({
      where: { orderId },
      include: { events: { orderBy: { occurredAt: 'desc' } } },
    });
  }

  async findShipmentByTracking(trackingNumber: string) {
    return this.prisma.shipment.findFirst({
      where: { trackingNumber },
      include: { events: { orderBy: { occurredAt: 'desc' } }, order: { select: { orderNumber: true, status: true } } },
    });
  }

  async findAllShipments(page = 1, limit = 20) {
    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        include: { events: { take: 1, orderBy: { occurredAt: 'desc' } }, order: { select: { orderNumber: true, status: true, user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shipment.count(),
    ]);
    return { shipments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createShipment(data: {
    orderId: string;
    courier: CourierProvider;
    trackingNumber: string;
    courierOrderId?: string;
    estimatedAt?: Date;
    notes?: string;
  }) {
    return this.prisma.shipment.create({
      data: {
        orderId: data.orderId,
        courier: data.courier,
        trackingNumber: data.trackingNumber,
        courierOrderId: data.courierOrderId,
        estimatedAt: data.estimatedAt,
        notes: data.notes,
        events: {
          create: {
            status: 'DISPATCHED',
            description: `Dispatched via ${data.courier}`,
            occurredAt: new Date(),
          },
        },
      },
      include: { events: true },
    });
  }

  async updateShipmentEvents(shipmentId: string, events: { status: string; location?: string; description?: string; occurredAt: Date }[]) {
    // Upsert events by occurredAt to avoid duplicates
    for (const ev of events) {
      await this.prisma.shipmentEvent.upsert({
        where: { id: `${shipmentId}-${ev.occurredAt.getTime()}` },
        update: {},
        create: { id: `${shipmentId}-${ev.occurredAt.getTime()}`, shipmentId, ...ev },
      });
    }
    return this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { events: { orderBy: { occurredAt: 'desc' } } },
    });
  }

  async updateShipmentDelivered(shipmentId: string) {
    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { deliveredAt: new Date() },
    });
  }

  async updateOrderTracking(orderId: string, trackingNumber: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber, status: OrderStatus.SHIPPED },
    });
  }
}
