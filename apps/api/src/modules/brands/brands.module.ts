import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsRepository } from './brands.repository';
import { BrandsController } from './brands.controller';

@Module({
  controllers: [BrandsController],
  providers: [BrandsService, BrandsRepository],
  exports: [BrandsService],
})
export class BrandsModule {}
