import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

const CATALOG_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active brands' })
  async list() {
    const brands = await this.brandsService.listActive();
    return { message: 'Brands retrieved', data: { brands } };
  }

  @Roles(...CATALOG_ROLES)
  @Get('admin/all')
  @ApiOperation({ summary: 'List all brands, including inactive (staff only)' })
  async listAll() {
    const brands = await this.brandsService.listAll();
    return { message: 'Brands retrieved', data: { brands } };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a brand by slug' })
  async getBySlug(@Param('slug') slug: string) {
    const brand = await this.brandsService.getBySlug(slug);
    return { message: 'Brand retrieved', data: { brand } };
  }

  @Roles(...CATALOG_ROLES)
  @Post()
  @ApiOperation({ summary: 'Create a brand (staff only)' })
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.brandsService.create(dto);
    return { message: 'Brand created', data: { brand } };
  }

  @Roles(...CATALOG_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a brand (staff only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.update(id, dto);
    return { message: 'Brand updated', data: { brand } };
  }

  @Roles(...CATALOG_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a brand (staff only)' })
  async remove(@Param('id') id: string) {
    await this.brandsService.remove(id);
    return { message: 'Brand deleted' };
  }
}
