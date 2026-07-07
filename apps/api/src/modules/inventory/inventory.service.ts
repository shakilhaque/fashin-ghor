import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TransferStatus } from '@prisma/client';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { StockTransferQueryDto } from './dto/stock-transfer-query.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { DamageReportDto } from './dto/damage-report.dto';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly repo: InventoryRepository) {}

  // ── Warehouses ─────────────────────────────────────────────────────────────

  findAllWarehouses() {
    return this.repo.findAllWarehouses();
  }

  async findWarehouseById(id: string) {
    const wh = await this.repo.findWarehouseById(id);
    if (!wh) throw new NotFoundException('Warehouse not found');
    return wh;
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    const existing = await this.repo.findWarehouseByCode(dto.code);
    if (existing) throw new ConflictException(`Warehouse code '${dto.code}' already exists`);
    return this.repo.createWarehouse(dto);
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto) {
    await this.findWarehouseById(id);
    if (dto.code) {
      const existing = await this.repo.findWarehouseByCode(dto.code);
      if (existing && existing.id !== id) throw new ConflictException(`Warehouse code '${dto.code}' already in use`);
    }
    return this.repo.updateWarehouse(id, dto);
  }

  // ── Inventory ──────────────────────────────────────────────────────────────

  async getInventory(query: InventoryQueryDto) {
    const { page = 1, limit = 20, warehouseId, productId } = query;
    const { items, total } = await this.repo.findInventory({ page, limit, warehouseId, productId });
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  getLowStockItems() {
    return this.repo.getLowStockItems();
  }

  // ── Purchase Orders ────────────────────────────────────────────────────────

  async findAllPurchaseOrders(query: PurchaseOrderQueryDto) {
    const { page = 1, limit = 20, warehouseId, status } = query;
    const [orders, total] = await this.repo.findAllPurchaseOrders({ page, limit, warehouseId, status });
    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPurchaseOrderById(id: string) {
    const po = await this.repo.findPurchaseOrderById(id);
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    const poNumber = `PO-${Date.now()}`;
    return this.repo.createPurchaseOrder({
      poNumber,
      supplier: dto.supplier,
      notes: dto.notes,
      expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
      warehouse: { connect: { id: dto.warehouseId } },
      items: {
        create: dto.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          orderedQty: item.orderedQty,
          costPrice: item.costPrice,
        })),
      },
    });
  }

  async confirmPurchaseOrder(id: string) {
    const po = await this.findPurchaseOrderById(id);
    if (po.status !== 'DRAFT') {
      throw new BadRequestException(`Only DRAFT purchase orders can be confirmed. Current status: ${po.status}`);
    }
    return this.repo.updatePurchaseOrder(id, { status: 'CONFIRMED' });
  }

  async receivePurchaseOrder(id: string, dto: ReceivePurchaseOrderDto) {
    const po = await this.findPurchaseOrderById(id);
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot receive items for a ${po.status} purchase order`);
    }
    if (po.status === 'DRAFT') {
      throw new BadRequestException('Purchase order must be CONFIRMED before receiving items');
    }
    return this.repo.receivePurchaseOrderItems(id, dto.items, po.warehouseId);
  }

  async cancelPurchaseOrder(id: string) {
    const po = await this.findPurchaseOrderById(id);
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel a ${po.status} purchase order`);
    }
    return this.repo.updatePurchaseOrder(id, { status: 'CANCELLED' });
  }

  // ── Stock Transfers ────────────────────────────────────────────────────────

  async findAllTransfers(query: StockTransferQueryDto) {
    const { page = 1, limit = 20, warehouseId, status } = query;
    const [transfers, total] = await this.repo.findAllTransfers({ page, limit, warehouseId, status });
    return {
      transfers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTransferById(id: string) {
    const t = await this.repo.findTransferById(id);
    if (!t) throw new NotFoundException('Stock transfer not found');
    return t;
  }

  async createTransfer(dto: CreateStockTransferDto) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }
    const transferNumber = `TRF-${Date.now()}`;
    return this.repo.createTransfer({
      transferNumber,
      notes: dto.notes,
      fromWarehouse: { connect: { id: dto.fromWarehouseId } },
      toWarehouse: { connect: { id: dto.toWarehouseId } },
      items: {
        create: dto.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      },
    });
  }

  async dispatchTransfer(id: string) {
    const t = await this.findTransferById(id);
    if (t.status !== 'PENDING') {
      throw new BadRequestException(`Only PENDING transfers can be dispatched. Current: ${t.status}`);
    }
    return this.repo.updateTransferStatus(id, TransferStatus.IN_TRANSIT);
  }

  async completeTransfer(id: string) {
    const t = await this.findTransferById(id);
    if (t.status !== 'IN_TRANSIT') {
      throw new BadRequestException(`Only IN_TRANSIT transfers can be completed. Current: ${t.status}`);
    }
    return this.repo.completeTransfer(id);
  }

  async cancelTransfer(id: string) {
    const t = await this.findTransferById(id);
    if (t.status !== 'PENDING') {
      throw new BadRequestException(`Only PENDING transfers can be cancelled. Current: ${t.status}`);
    }
    return this.repo.updateTransferStatus(id, TransferStatus.CANCELLED);
  }

  // ── Stock Adjustments ──────────────────────────────────────────────────────

  async createAdjustment(dto: StockAdjustmentDto) {
    return this.repo.createStockAdjustment({
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      variantId: dto.variantId,
      type: dto.type,
      quantity: dto.quantity,
      reason: dto.reason,
      reference: dto.reference,
    });
  }

  async getAdjustments(query: InventoryQueryDto) {
    const { page = 1, limit = 20, warehouseId, productId } = query;
    const [items, total] = await this.repo.findAdjustments({ page, limit, warehouseId, productId });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Damage Reports ─────────────────────────────────────────────────────────

  async createDamageReport(dto: DamageReportDto) {
    const reportNumber = `DMG-${Date.now()}`;
    return this.repo.createDamageReport({
      reportNumber,
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      description: dto.description,
    });
  }

  async getDamageReports(query: InventoryQueryDto) {
    const { page = 1, limit = 20, warehouseId } = query;
    const [items, total] = await this.repo.findDamageReports({ page, limit, warehouseId });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
