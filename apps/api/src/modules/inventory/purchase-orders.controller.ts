import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { InventoryService } from './inventory.service';

const INVENTORY_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE] as const;
const MGMT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @Roles(...INVENTORY_ROLES)
  async findAll(@Query() query: PurchaseOrderQueryDto) {
    const result = await this.service.findAllPurchaseOrders(query);
    return { message: 'Purchase orders retrieved', data: { orders: result.orders }, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
  }

  @Get(':id')
  @Roles(...INVENTORY_ROLES)
  async findOne(@Param('id') id: string) {
    const order = await this.service.findPurchaseOrderById(id);
    return { message: 'Purchase order retrieved', data: { order } };
  }

  @Post()
  @Roles(...MGMT_ROLES)
  async create(@Body() dto: CreatePurchaseOrderDto) {
    const order = await this.service.createPurchaseOrder(dto);
    return { message: 'Purchase order created', data: { order } };
  }

  @Post(':id/confirm')
  @Roles(...MGMT_ROLES)
  async confirm(@Param('id') id: string) {
    const order = await this.service.confirmPurchaseOrder(id);
    return { message: 'Purchase order confirmed', data: { order } };
  }

  @Post(':id/receive')
  @Roles(...INVENTORY_ROLES)
  async receive(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto) {
    const order = await this.service.receivePurchaseOrder(id, dto);
    return { message: 'Items received', data: { order } };
  }

  @Post(':id/cancel')
  @Roles(...MGMT_ROLES)
  async cancel(@Param('id') id: string) {
    const order = await this.service.cancelPurchaseOrder(id);
    return { message: 'Purchase order cancelled', data: { order } };
  }
}
