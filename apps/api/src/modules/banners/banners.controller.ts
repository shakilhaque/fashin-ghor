import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BannerType } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] as const;

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Public()
  @Get()
  async getActive() {
    const banners = await this.service.getActive();
    return { data: banners };
  }

  @Roles(...ADMIN_ROLES)
  @Get('admin/all')
  async getAll() {
    const banners = await this.service.getAll();
    return { data: banners };
  }

  @Roles(...ADMIN_ROLES)
  @Post()
  async create(@Body() dto: CreateBannerDto) {
    const banner = await this.service.create(dto);
    return { data: banner };
  }

  @Roles(...ADMIN_ROLES)
  @Patch('reorder')
  async reorder(@Body() items: { id: string; position: number; type: BannerType }[]) {
    await this.service.reorder(items);
    return { message: 'Reordered' };
  }

  @Roles(...ADMIN_ROLES)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    const banner = await this.service.update(id, dto);
    return { data: banner };
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Deleted' };
  }
}
