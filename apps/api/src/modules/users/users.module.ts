import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { AddressesService } from './addresses.service';
import { AddressesRepository } from './addresses.repository';
import { AddressesController } from './addresses.controller';

@Module({
  controllers: [UsersController, AddressesController],
  providers: [UsersService, UsersRepository, AddressesService, AddressesRepository],
  exports: [UsersService],
})
export class UsersModule {}
