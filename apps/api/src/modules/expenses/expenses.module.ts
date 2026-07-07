import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesController } from './expenses.controller';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
})
export class ExpensesModule {}
