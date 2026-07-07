import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DamageReportDto } from './dto/damage-report.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { InventoryService } from './inventory.service';

const INVENTORY_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE] as const;
const MGMT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @Roles(...INVENTORY_ROLES)
  async getInventory(@Query() query: InventoryQueryDto) {
    const result = await this.service.getInventory(query);
    return { message: 'Inventory retrieved', data: result, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
  }

  @Get('low-stock')
  @Roles(...INVENTORY_ROLES)
  async getLowStock() {
    const items = await this.service.getLowStockItems();
    return { message: 'Low stock items retrieved', data: { items } };
  }

  @Post('adjust')
  @Roles(...MGMT_ROLES)
  async adjust(@Body() dto: StockAdjustmentDto) {
    const adjustment = await this.service.createAdjustment(dto);
    return { message: 'Stock adjustment recorded', data: { adjustment } };
  }

  @Get('adjustments')
  @Roles(...INVENTORY_ROLES)
  async getAdjustments(@Query() query: InventoryQueryDto) {
    const result = await this.service.getAdjustments(query);
    return { message: 'Adjustments retrieved', data: result, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
  }

  @Post('damage')
  @Roles(...MGMT_ROLES)
  async reportDamage(@Body() dto: DamageReportDto) {
    const report = await this.service.createDamageReport(dto);
    return { message: 'Damage report created', data: { report } };
  }

  @Get('damage')
  @Roles(...INVENTORY_ROLES)
  async getDamageReports(@Query() query: InventoryQueryDto) {
    const result = await this.service.getDamageReports(query);
    return { message: 'Damage reports retrieved', data: result, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
  }
}
