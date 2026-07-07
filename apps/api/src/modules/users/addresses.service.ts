import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Address } from '@prisma/client';
import { AddressesRepository } from './addresses.repository';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly addressesRepository: AddressesRepository) {}

  list(userId: string): Promise<Address[]> {
    return this.addressesRepository.findManyByUser(userId);
  }

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const existing = await this.addressesRepository.findManyByUser(userId);
    const shouldBeDefault = dto.isDefault || existing.length === 0;

    if (shouldBeDefault) {
      await this.addressesRepository.unsetDefaultForUser(userId);
    }

    return this.addressesRepository.create({
      user: { connect: { id: userId } },
      label: dto.label ?? 'Home',
      recipientName: dto.recipientName,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country ?? 'BD',
      isDefault: shouldBeDefault,
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto): Promise<Address> {
    const address = await this.getOwnedAddressOrThrow(userId, addressId);

    if (dto.isDefault) {
      await this.addressesRepository.unsetDefaultForUser(userId);
    }

    return this.addressesRepository.update(address.id, {
      label: dto.label,
      recipientName: dto.recipientName,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
      isDefault: dto.isDefault,
    });
  }

  async remove(userId: string, addressId: string): Promise<void> {
    await this.getOwnedAddressOrThrow(userId, addressId);
    await this.addressesRepository.delete(addressId);
  }

  private async getOwnedAddressOrThrow(userId: string, addressId: string): Promise<Address> {
    const address = await this.addressesRepository.findById(addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }
    return address;
  }
}
