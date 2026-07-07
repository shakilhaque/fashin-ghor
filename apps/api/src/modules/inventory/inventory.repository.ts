import { Injectable } from '@nestjs/common';
import { AdjustmentType, Prisma, PurchaseOrderStatus, TransferStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const warehouseInclude = { _count: { select: { inventories: true } } } as const;

const poInclude = {
  warehouse: { select: { id: true, name: true, code: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true } },
      variant: { select: { id: true, sku: true, color: true, size: true } },
    },
  },
} as const;

const transferInclude = {
  fromWarehouse: { select: { id: true, name: true, code: true } },
  toWarehouse: { select: { id: true, name: true, code: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true } },
      variant: { select: { id: true, sku: true, color: true, size: true } },
    },
  },
} as const;

const inventoryInclude = {
  warehouse: { select: { id: true, name: true, code: true } },
  product: { select: { id: true, name: true, sku: true } },
  variant: { select: { id: true, sku: true, color: true, size: true } },
} as const;

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Warehouses ─────────────────────────────────────────────────────────────

  findAllWarehouses() {
    return this.prisma.warehouse.findMany({
      include: warehouseInclude,
      orderBy: { name: 'asc' },
    });
  }

  findWarehouseById(id: string) {
    return this.prisma.warehouse.findUnique({ where: { id }, include: warehouseInclude });
  }

  findWarehouseByCode(code: string) {
    return this.prisma.warehouse.findUnique({ where: { code } });
  }

  findDefaultWarehouse() {
    return this.prisma.warehouse.findFirst({ where: { isDefault: true, isActive: true } });
  }

  async createWarehouse(data: Prisma.WarehouseCreateInput) {
    if (data.isDefault) {
      await this.prisma.warehouse.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return this.prisma.warehouse.create({ data, include: warehouseInclude });
  }

  async updateWarehouse(id: string, data: Prisma.WarehouseUpdateInput) {
    if (data.isDefault) {
      await this.prisma.warehouse.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return this.prisma.warehouse.update({ where: { id }, data, include: warehouseInclude });
  }

  // ── Inventory items ────────────────────────────────────────────────────────

  async findInventory(params: { warehouseId?: string; productId?: string; lowStockOnly?: boolean; page: number; limit: number }) {
    const { warehouseId, productId, page, limit } = params;

    const where: Prisma.InventoryWhereInput = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;
    // low-stock: quantity <= lowStockAt
    // Prisma doesn't support column-to-column comparison natively, so we use raw filter
    // We approximate by reading all and filtering, OR store a separate flag.
    // For now, lowStockOnly is handled in service via a raw query approach.

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: inventoryInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return { items, total };
  }

  findInventoryItem(productId: string, variantId: string | null, warehouseId: string) {
    return this.prisma.inventory.findFirst({
      where: { productId, variantId: variantId ?? undefined, warehouseId },
    });
  }

  upsertInventoryItem(
    productId: string,
    variantId: string | null,
    warehouseId: string,
    quantityDelta: number,
    lowStockAt?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findFirst({
        where: { productId, variantId: variantId ?? undefined, warehouseId },
      });

      if (existing) {
        return tx.inventory.update({
          where: { id: existing.id },
          data: {
            quantity: { increment: quantityDelta },
            ...(lowStockAt !== undefined && { lowStockAt }),
          },
        });
      }

      return tx.inventory.create({
        data: {
          productId,
          variantId: variantId ?? undefined,
          warehouseId,
          quantity: Math.max(0, quantityDelta),
          ...(lowStockAt !== undefined && { lowStockAt }),
        },
      });
    });
  }

  getLowStockItems() {
    return this.prisma.$queryRaw<Array<{ id: string; productId: string; warehouseId: string; quantity: number; lowStockAt: number }>>`
      SELECT id, "productId", "warehouseId", quantity, "lowStockAt"
      FROM inventory
      WHERE quantity <= "lowStockAt"
      ORDER BY quantity ASC
    `;
  }

  // ── Purchase Orders ────────────────────────────────────────────────────────

  findAllPurchaseOrders(params: { page: number; limit: number; warehouseId?: string; status?: PurchaseOrderStatus }) {
    const { page, limit, warehouseId, status } = params;
    const where: Prisma.PurchaseOrderWhereInput = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;

    return Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: poInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
  }

  findPurchaseOrderById(id: string) {
    return this.prisma.purchaseOrder.findUnique({ where: { id }, include: poInclude });
  }

  findPurchaseOrderByNumber(poNumber: string) {
    return this.prisma.purchaseOrder.findUnique({ where: { poNumber } });
  }

  createPurchaseOrder(data: Prisma.PurchaseOrderCreateInput) {
    return this.prisma.purchaseOrder.create({ data, include: poInclude });
  }

  updatePurchaseOrder(id: string, data: Prisma.PurchaseOrderUpdateInput) {
    return this.prisma.purchaseOrder.update({ where: { id }, data, include: poInclude });
  }

  async receivePurchaseOrderItems(
    poId: string,
    receives: Array<{ itemId: string; receivedQty: number }>,
    warehouseId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUniqueOrThrow({
        where: { id: poId },
        include: { items: true },
      });

      let allFullyReceived = true;
      let anyReceived = false;

      for (const { itemId, receivedQty } of receives) {
        if (receivedQty <= 0) continue;
        const item = po.items.find((i) => i.id === itemId);
        if (!item) continue;

        const newReceived = item.receivedQty + receivedQty;
        await tx.purchaseOrderItem.update({
          where: { id: itemId },
          data: { receivedQty: newReceived },
        });

        // Update inventory
        const existing = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            warehouseId,
          },
        });

        if (existing) {
          await tx.inventory.update({
            where: { id: existing.id },
            data: { quantity: { increment: receivedQty } },
          });
        } else {
          await tx.inventory.create({
            data: {
              productId: item.productId,
              variantId: item.variantId ?? undefined,
              warehouseId,
              quantity: receivedQty,
            },
          });
        }

        // Sync Product.stock / ProductVariant.stock
        if (item.variantId) {
          const totalVariantStock = await tx.inventory.aggregate({
            where: { variantId: item.variantId },
            _sum: { quantity: true },
          });
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: totalVariantStock._sum.quantity ?? 0 },
          });
        }

        const totalProductStock = await tx.inventory.aggregate({
          where: { productId: item.productId, variantId: null },
          _sum: { quantity: true },
        });
        const totalVariantProductStock = await tx.inventory.aggregate({
          where: { productId: item.productId, variantId: { not: null } },
          _sum: { quantity: true },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: (totalProductStock._sum.quantity ?? 0) + (totalVariantProductStock._sum.quantity ?? 0),
          },
        });

        anyReceived = true;
        const refreshedItem = await tx.purchaseOrderItem.findUniqueOrThrow({ where: { id: itemId } });
        if (refreshedItem.receivedQty < refreshedItem.orderedQty) allFullyReceived = false;
      }

      // Check remaining items not in this receive call
      const allItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
      for (const item of allItems) {
        if (receives.find((r) => r.itemId === item.id)) continue;
        if (item.receivedQty < item.orderedQty) allFullyReceived = false;
      }

      const newStatus: PurchaseOrderStatus = allFullyReceived
        ? 'RECEIVED'
        : anyReceived
          ? 'PARTIALLY_RECEIVED'
          : po.status;

      return tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: newStatus,
          ...(allFullyReceived && { receivedAt: new Date() }),
        },
        include: poInclude,
      });
    });
  }

  // ── Stock Transfers ────────────────────────────────────────────────────────

  findAllTransfers(params: { page: number; limit: number; warehouseId?: string; status?: TransferStatus }) {
    const { page, limit, warehouseId, status } = params;
    const where: Prisma.StockTransferWhereInput = {};
    if (warehouseId) {
      where.OR = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }];
    }
    if (status) where.status = status;

    return Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        include: transferInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);
  }

  findTransferById(id: string) {
    return this.prisma.stockTransfer.findUnique({ where: { id }, include: transferInclude });
  }

  findTransferByNumber(transferNumber: string) {
    return this.prisma.stockTransfer.findUnique({ where: { transferNumber } });
  }

  createTransfer(data: Prisma.StockTransferCreateInput) {
    return this.prisma.stockTransfer.create({ data, include: transferInclude });
  }

  updateTransferStatus(id: string, status: TransferStatus, completedAt?: Date) {
    return this.prisma.stockTransfer.update({
      where: { id },
      data: { status, ...(completedAt && { completedAt }) },
      include: transferInclude,
    });
  }

  async completeTransfer(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });

      for (const item of transfer.items) {
        // Deduct from source
        const fromInv = await tx.inventory.findFirst({
          where: { productId: item.productId, variantId: item.variantId ?? undefined, warehouseId: transfer.fromWarehouseId },
        });
        if (fromInv) {
          await tx.inventory.update({
            where: { id: fromInv.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        // Add to destination
        const toInv = await tx.inventory.findFirst({
          where: { productId: item.productId, variantId: item.variantId ?? undefined, warehouseId: transfer.toWarehouseId },
        });
        if (toInv) {
          await tx.inventory.update({
            where: { id: toInv.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.inventory.create({
            data: {
              productId: item.productId,
              variantId: item.variantId ?? undefined,
              warehouseId: transfer.toWarehouseId,
              quantity: item.quantity,
            },
          });
        }
      }

      return tx.stockTransfer.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: transferInclude,
      });
    });
  }

  // ── Stock Adjustments ──────────────────────────────────────────────────────

  async createStockAdjustment(data: {
    warehouseId: string;
    productId: string;
    variantId?: string;
    type: AdjustmentType;
    quantity: number;
    reason?: string;
    reference?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const delta = data.type === 'ADD' ? data.quantity : -data.quantity;

      const existing = await tx.inventory.findFirst({
        where: { productId: data.productId, variantId: data.variantId ?? undefined, warehouseId: data.warehouseId },
      });

      if (existing) {
        await tx.inventory.update({
          where: { id: existing.id },
          data: { quantity: { increment: delta } },
        });
      } else {
        await tx.inventory.create({
          data: {
            productId: data.productId,
            variantId: data.variantId ?? undefined,
            warehouseId: data.warehouseId,
            quantity: Math.max(0, delta),
          },
        });
      }

      // Sync product/variant stock totals
      if (data.variantId) {
        const agg = await tx.inventory.aggregate({
          where: { variantId: data.variantId },
          _sum: { quantity: true },
        });
        await tx.productVariant.update({
          where: { id: data.variantId },
          data: { stock: Math.max(0, agg._sum.quantity ?? 0) },
        });
      }

      const aggNull = await tx.inventory.aggregate({
        where: { productId: data.productId, variantId: null },
        _sum: { quantity: true },
      });
      const aggVariant = await tx.inventory.aggregate({
        where: { productId: data.productId, variantId: { not: null } },
        _sum: { quantity: true },
      });
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: Math.max(0, (aggNull._sum.quantity ?? 0) + (aggVariant._sum.quantity ?? 0)) },
      });

      return tx.stockAdjustment.create({
        data: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          variantId: data.variantId ?? undefined,
          type: data.type,
          quantity: data.type === 'ADD' ? data.quantity : -data.quantity,
          reason: data.reason,
          reference: data.reference,
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, sku: true, color: true, size: true } },
        },
      });
    });
  }

  findAdjustments(params: { page: number; limit: number; warehouseId?: string; productId?: string }) {
    const { page, limit, warehouseId, productId } = params;
    const where: Prisma.StockAdjustmentWhereInput = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;

    return Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, sku: true, color: true, size: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);
  }

  // ── Damage Reports ─────────────────────────────────────────────────────────

  async createDamageReport(data: {
    warehouseId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    description?: string;
    reportNumber: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Deduct from inventory
      const existing = await tx.inventory.findFirst({
        where: { productId: data.productId, variantId: data.variantId ?? undefined, warehouseId: data.warehouseId },
      });
      if (existing && existing.quantity >= data.quantity) {
        await tx.inventory.update({
          where: { id: existing.id },
          data: { quantity: { decrement: data.quantity } },
        });
      }

      // Sync product/variant stock
      if (data.variantId) {
        const agg = await tx.inventory.aggregate({
          where: { variantId: data.variantId },
          _sum: { quantity: true },
        });
        await tx.productVariant.update({
          where: { id: data.variantId },
          data: { stock: Math.max(0, agg._sum.quantity ?? 0) },
        });
      }
      const aggNull = await tx.inventory.aggregate({
        where: { productId: data.productId, variantId: null },
        _sum: { quantity: true },
      });
      const aggVar = await tx.inventory.aggregate({
        where: { productId: data.productId, variantId: { not: null } },
        _sum: { quantity: true },
      });
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: Math.max(0, (aggNull._sum.quantity ?? 0) + (aggVar._sum.quantity ?? 0)) },
      });

      return tx.damageReport.create({
        data: {
          reportNumber: data.reportNumber,
          warehouseId: data.warehouseId,
          productId: data.productId,
          variantId: data.variantId ?? undefined,
          quantity: data.quantity,
          description: data.description,
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, sku: true, color: true, size: true } },
        },
      });
    });
  }

  findDamageReports(params: { page: number; limit: number; warehouseId?: string }) {
    const { page, limit, warehouseId } = params;
    const where: Prisma.DamageReportWhereInput = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return Promise.all([
      this.prisma.damageReport.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, sku: true, color: true, size: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.damageReport.count({ where }),
    ]);
  }
}
