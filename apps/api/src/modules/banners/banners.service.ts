import { Injectable, NotFoundException } from '@nestjs/common';
import { BannerType } from '@prisma/client';
import { BannersRepository } from './banners.repository';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly repo: BannersRepository) {}

  getActive() {
    return this.repo.findActive();
  }

  getAll() {
    return this.repo.findAll();
  }

  async getById(id: string) {
    const banner = await this.repo.findById(id);
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  create(dto: CreateBannerDto) {
    return this.repo.create({
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.getById(id);
    return this.repo.update(id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async remove(id: string) {
    await this.getById(id);
    return this.repo.delete(id);
  }

  reorder(items: { id: string; position: number; type: BannerType }[]) {
    return this.repo.reorder(items);
  }
}
