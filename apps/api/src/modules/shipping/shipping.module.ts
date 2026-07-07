import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PathaoCourier } from './couriers/pathao.courier';
import { SteadfastCourier } from './couriers/steadfast.courier';
import { RedxCourier } from './couriers/redx.courier';
import { CustomCourier } from './couriers/custom.courier';
import { CourierGatewayFactory } from './couriers/courier-gateway.factory';
import { ShippingController } from './shipping.controller';
import { ShippingRepository } from './shipping.repository';
import { ShippingService } from './shipping.service';

@Module({
  imports: [PrismaModule],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    ShippingRepository,
    CourierGatewayFactory,
    PathaoCourier,
    SteadfastCourier,
    RedxCourier,
    CustomCourier,
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
