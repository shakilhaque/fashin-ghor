import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { StockTransfersController } from './stock-transfers.controller';
import { WarehousesController } from './warehouses.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WarehousesController, InventoryController, PurchaseOrdersController, StockTransfersController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
