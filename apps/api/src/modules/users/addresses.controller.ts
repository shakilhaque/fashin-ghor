import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@Controller('users/me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's addresses" })
  async list(@CurrentUser() authUser: AuthenticatedUser) {
    const addresses = await this.addressesService.list(authUser.id);
    return { message: 'Addresses retrieved', data: { addresses } };
  }

  @Post()
  @ApiOperation({ summary: 'Add a new address' })
  async create(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: CreateAddressDto) {
    const address = await this.addressesService.create(authUser.id, dto);
    return { message: 'Address added', data: { address } };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  async update(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const address = await this.addressesService.update(authUser.id, id, dto);
    return { message: 'Address updated', data: { address } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an address' })
  async remove(@CurrentUser() authUser: AuthenticatedUser, @Param('id') id: string) {
    await this.addressesService.remove(authUser.id, id);
    return { message: 'Address deleted' };
  }
}
