import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { CombosService } from './combos.service';
import { CombosRepository } from './combos.repository';
import { CombosController } from './combos.controller';

@Module({
  imports: [ProductsModule],
  controllers: [CombosController],
  providers: [CombosService, CombosRepository],
  exports: [CombosService],
})
export class CombosModule {}
