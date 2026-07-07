import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATALOG_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get the active category tree' })
  async getTree() {
    const categories = await this.categoriesService.getTree();
    return { message: 'Categories retrieved', data: { categories } };
  }

  @Roles(...CATALOG_ROLES)
  @Get('admin/all')
  @ApiOperation({ summary: 'Get the full category tree, including inactive (staff only)' })
  async getAdminTree() {
    const categories = await this.categoriesService.getAdminTree();
    return { message: 'Categories retrieved', data: { categories } };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a category by slug, with its parent and active children' })
  async getBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.getBySlug(slug);
    return { message: 'Category retrieved', data: { category } };
  }

  @Roles(...CATALOG_ROLES)
  @Post()
  @ApiOperation({ summary: 'Create a category (staff only)' })
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return { message: 'Category created', data: { category } };
  }

  @Roles(...CATALOG_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a category (staff only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.categoriesService.update(id, dto);
    return { message: 'Category updated', data: { category } };
  }

  @Roles(...CATALOG_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category (staff only)' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return { message: 'Category deleted' };
  }
}
