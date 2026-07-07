import { Injectable } from '@nestjs/common';
import { CourierProvider } from '@prisma/client';
import type { CourierGateway } from './courier-gateway.interface';
import { PathaoCourier } from './pathao.courier';
import { SteadfastCourier } from './steadfast.courier';
import { RedxCourier } from './redx.courier';
import { CustomCourier } from './custom.courier';

@Injectable()
export class CourierGatewayFactory {
  constructor(
    private readonly pathao: PathaoCourier,
    private readonly steadfast: SteadfastCourier,
    private readonly redx: RedxCourier,
    private readonly custom: CustomCourier,
  ) {}

  getGateway(provider: CourierProvider): CourierGateway {
    switch (provider) {
      case CourierProvider.PATHAO:
        return this.pathao;
      case CourierProvider.STEADFAST:
        return this.steadfast;
      case CourierProvider.REDX:
        return this.redx;
      case CourierProvider.SUNDARBAN:
      case CourierProvider.PAPER_FLY:
      case CourierProvider.CUSTOM:
      default:
        return this.custom;
    }
  }
}
