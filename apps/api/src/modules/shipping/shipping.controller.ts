import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateRateDto } from './dto/create-rate.dto';
import { DispatchShipmentDto } from './dto/dispatch-shipment.dto';
import { ShippingService } from './shipping.service';

const MGMT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;
const OPS_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE] as const;

@Controller('shipping')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  // ── Public ───────────────────────────────────────────────────────────────

  @Public()
  @Get('rates')
  async getPublicRates() {
    const rates = await this.service.getPublicRates();
    return { message: 'Shipping rates retrieved', data: { rates } };
  }

  @Public()
  @Get('track/:trackingNumber')
  async track(@Param('trackingNumber') trackingNumber: string) {
    const result = await this.service.trackByNumber(trackingNumber);
    return { message: 'Tracking info retrieved', data: { tracking: result } };
  }

  // ── Admin — Zones ────────────────────────────────────────────────────────

  @Get('zones')
  @Roles(...OPS_ROLES)
  async getZones() {
    const zones = await this.service.getZones();
    return { message: 'Shipping zones retrieved', data: { zones } };
  }

  @Get('zones/:id')
  @Roles(...OPS_ROLES)
  async getZone(@Param('id') id: string) {
    const zone = await this.service.getZone(id);
    return { message: 'Zone retrieved', data: { zone } };
  }

  @Post('zones')
  @Roles(...MGMT_ROLES)
  async createZone(@Body() dto: CreateZoneDto) {
    const zone = await this.service.createZone(dto);
    return { message: 'Shipping zone created', data: { zone } };
  }

  @Patch('zones/:id')
  @Roles(...MGMT_ROLES)
  async updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    const zone = await this.service.updateZone(id, dto);
    return { message: 'Shipping zone updated', data: { zone } };
  }

  @Delete('zones/:id')
  @Roles(...MGMT_ROLES)
  async deleteZone(@Param('id') id: string) {
    await this.service.deleteZone(id);
    return { message: 'Shipping zone deleted', data: null };
  }

  // ── Admin — Rates ─────────────────────────────────────────────────────

  @Post('zones/:zoneId/rates')
  @Roles(...MGMT_ROLES)
  async addRate(@Param('zoneId') zoneId: string, @Body() dto: CreateRateDto) {
    const rate = await this.service.addRate(zoneId, dto);
    return { message: 'Shipping rate created', data: { rate } };
  }

  @Patch('rates/:id')
  @Roles(...MGMT_ROLES)
  async updateRate(@Param('id') id: string, @Body() dto: CreateRateDto) {
    const rate = await this.service.updateRate(id, dto);
    return { message: 'Shipping rate updated', data: { rate } };
  }

  @Delete('rates/:id')
  @Roles(...MGMT_ROLES)
  async deleteRate(@Param('id') id: string) {
    await this.service.deleteRate(id);
    return { message: 'Shipping rate deleted', data: null };
  }

  // ── Admin — Shipments ────────────────────────────────────────────────────

  @Get('shipments')
  @Roles(...OPS_ROLES)
  async getShipments(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.service.getShipments(Number(page), Number(limit));
    return {
      message: 'Shipments retrieved',
      data: { shipments: result.shipments },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get('shipments/:orderId')
  @Roles(...OPS_ROLES)
  async getShipment(@Param('orderId') orderId: string) {
    const shipment = await this.service.getShipmentByOrder(orderId);
    return { message: 'Shipment retrieved', data: { shipment } };
  }

  @Post('dispatch')
  @Roles(...OPS_ROLES)
  async dispatch(@Body() dto: DispatchShipmentDto) {
    const shipment = await this.service.dispatchOrder(dto);
    return { message: 'Order dispatched successfully', data: { shipment } };
  }

  @Post('shipments/:orderId/refresh')
  @Roles(...OPS_ROLES)
  async refreshTracking(@Param('orderId') orderId: string) {
    const shipment = await this.service.refreshTracking(orderId);
    return { message: 'Tracking refreshed', data: { shipment } };
  }
}
