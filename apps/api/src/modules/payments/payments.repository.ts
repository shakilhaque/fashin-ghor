import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    currency?: string;
    gatewayTxnId: string;
    gatewayResponse?: Record<string, unknown>;
  }) {
    return this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method,
        amount: data.amount,
        currency: data.currency ?? 'BDT',
        gatewayTxnId: data.gatewayTxnId,
        gatewayResponse: (data.gatewayResponse ?? {}) as Prisma.InputJsonValue,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByGatewayTxnId(gatewayTxnId: string) {
    return this.prisma.payment.findFirst({ where: { gatewayTxnId } });
  }

  async markPaid(id: string, gatewayTxnId?: string, gatewayResponse?: Record<string, unknown>) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        ...(gatewayTxnId && { gatewayTxnId }),
        ...(gatewayResponse && { gatewayResponse: gatewayResponse as Prisma.InputJsonValue }),
      },
    });
  }

  async markFailed(id: string, gatewayResponse?: Record<string, unknown>) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.FAILED,
        ...(gatewayResponse && { gatewayResponse: gatewayResponse as Prisma.InputJsonValue }),
      },
    });
  }
}
