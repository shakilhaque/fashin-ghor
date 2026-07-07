import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

const CATALOG_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active products with search, filters, and pagination' })
  async list(@Query() query: ProductQueryDto) {
    const { data, total } = await this.productsService.listPublic(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return {
      message: 'Products retrieved',
      data: { products: data },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @Roles(...CATALOG_ROLES)
  @Get('admin/all')
  @ApiOperation({ summary: 'List all products, including inactive (staff only)' })
  async listAdmin(@Query() query: ProductQueryDto) {
    const { data, total } = await this.productsService.listAdmin(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return {
      message: 'Products retrieved',
      data: { products: data },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  async getBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.getBySlug(slug);
    return { message: 'Product retrieved', data: { product } };
  }

  @Roles(...CATALOG_ROLES)
  @Post()
  @ApiOperation({ summary: 'Create a product (staff only)' })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    return { message: 'Product created', data: { product } };
  }

  @Roles(...CATALOG_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (staff only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.productsService.update(id, dto);
    return { message: 'Product updated', data: { product } };
  }

  @Roles(...CATALOG_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product (staff only)' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { message: 'Product deleted' };
  }
}
