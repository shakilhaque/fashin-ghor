import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { InventoryService } from './inventory.service';

const INVENTORY_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE] as const;
const MGMT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @Roles(...INVENTORY_ROLES)
  async findAll() {
    const warehouses = await this.service.findAllWarehouses();
    return { message: 'Warehouses retrieved', data: { warehouses } };
  }

  @Get(':id')
  @Roles(...INVENTORY_ROLES)
  async findOne(@Param('id') id: string) {
    const warehouse = await this.service.findWarehouseById(id);
    return { message: 'Warehouse retrieved', data: { warehouse } };
  }

  @Post()
  @Roles(...MGMT_ROLES)
  async create(@Body() dto: CreateWarehouseDto) {
    const warehouse = await this.service.createWarehouse(dto);
    return { message: 'Warehouse created', data: { warehouse } };
  }

  @Patch(':id')
  @Roles(...MGMT_ROLES)
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    const warehouse = await this.service.updateWarehouse(id, dto);
    return { message: 'Warehouse updated', data: { warehouse } };
  }
}
