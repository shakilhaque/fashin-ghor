import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { StockTransferQueryDto } from './dto/stock-transfer-query.dto';
import { InventoryService } from './inventory.service';

const INVENTORY_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE] as const;
const MGMT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @Roles(...INVENTORY_ROLES)
  async findAll(@Query() query: StockTransferQueryDto) {
    const result = await this.service.findAllTransfers(query);
    return { message: 'Stock transfers retrieved', data: { transfers: result.transfers }, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
  }

  @Get(':id')
  @Roles(...INVENTORY_ROLES)
  async findOne(@Param('id') id: string) {
    const transfer = await this.service.findTransferById(id);
    return { message: 'Stock transfer retrieved', data: { transfer } };
  }

  @Post()
  @Roles(...MGMT_ROLES)
  async create(@Body() dto: CreateStockTransferDto) {
    const transfer = await this.service.createTransfer(dto);
    return { message: 'Stock transfer created', data: { transfer } };
  }

  @Post(':id/dispatch')
  @Roles(...INVENTORY_ROLES)
  async dispatch(@Param('id') id: string) {
    const transfer = await this.service.dispatchTransfer(id);
    return { message: 'Transfer dispatched', data: { transfer } };
  }

  @Post(':id/complete')
  @Roles(...INVENTORY_ROLES)
  async complete(@Param('id') id: string) {
    const transfer = await this.service.completeTransfer(id);
    return { message: 'Transfer completed', data: { transfer } };
  }

  @Post(':id/cancel')
  @Roles(...MGMT_ROLES)
  async cancel(@Param('id') id: string) {
    const transfer = await this.service.cancelTransfer(id);
    return { message: 'Transfer cancelled', data: { transfer } };
  }
}
